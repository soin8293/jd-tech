import { db } from "@/lib/firebase";
import { runTransaction, doc, writeBatch } from "firebase/firestore";
import { Room } from "@/types/hotel.types";
import { logger } from "./logger";

export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  retryable?: boolean;
}

export class TransactionManager {
  private static instance: TransactionManager;
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  static getInstance(): TransactionManager {
    if (!this.instance) {
      this.instance = new TransactionManager();
    }
    return this.instance;
  }

  /**
   * Atomic room operations using Firestore transactions
   */
  async saveRoomsAtomically(rooms: Room[]): Promise<TransactionResult<Room[]>> {
    try {
      logger.info('Starting atomic room save operation', { roomCount: rooms.length });

      const result = await runTransaction(db, async (transaction) => {
        // Validate all rooms first
        for (const room of rooms) {
          if (!room.id || !room.name) {
            throw new Error(`Invalid room data: ${JSON.stringify(room)}`);
          }
        }

        // Read current state for conflict detection and validation
        const currentRooms: Room[] = [];
        const conflicts: string[] = [];
        
        for (const room of rooms) {
          const roomRef = doc(db, 'rooms', room.id);
          const roomDoc = await transaction.get(roomRef);
          
          if (roomDoc.exists()) {
            const currentRoom = { id: room.id, ...roomDoc.data() } as Room;
            currentRooms.push(currentRoom);
            
            // Check for version conflicts (optimistic concurrency control)
            if (currentRoom.version && room.version && currentRoom.version > room.version) {
              conflicts.push(`Room ${room.name} has been modified by another user`);
            }
          }
        }
        
        if (conflicts.length > 0) {
          throw new Error(`Conflicts detected: ${conflicts.join(', ')}`);
        }

        // Apply all writes in the transaction
        for (const room of rooms) {
          const roomRef = doc(db, 'rooms', room.id);
          const roomData = {
            ...room,
            updatedAt: new Date(),
            version: (currentRooms.find(r => r.id === room.id)?.version || 0) + 1
          };
          transaction.set(roomRef, roomData);
        }

        return rooms;
      });

      logger.info('Atomic room save completed successfully');
      return { success: true, data: result };

    } catch (error: any) {
      logger.error('Atomic room save failed', error);
      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Atomic single room operation
   */
  async saveRoomAtomically(room: Room): Promise<TransactionResult<Room>> {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const roomRef = doc(db, 'rooms', room.id);
        const roomDoc = await transaction.get(roomRef);
        
        const currentVersion = roomDoc.exists() ? roomDoc.data()?.version || 0 : 0;
        const roomData = {
          ...room,
          updatedAt: new Date(),
          version: currentVersion + 1
        };

        transaction.set(roomRef, roomData);
        return roomData as Room;
      });

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Atomic room deletion with conflict checking
   */
  async deleteRoomAtomically(roomId: string): Promise<TransactionResult<string>> {
    try {
      await runTransaction(db, async (transaction) => {
        const roomRef = doc(db, 'rooms', roomId);
        const roomDoc = await transaction.get(roomRef);
        
        if (!roomDoc.exists()) {
          throw new Error(`Room ${roomId} not found`);
        }

        // Check for active bookings before deletion
        const roomData = roomDoc.data() as Room;
        if (roomData.bookings && roomData.bookings.length > 0) {
          const activeBookings = roomData.bookings.filter(
            booking => new Date(booking.checkOut) > new Date()
          );
          if (activeBookings.length > 0) {
            throw new Error(`Cannot delete room with active bookings`);
          }
        }

        transaction.delete(roomRef);
      });

      return { success: true, data: roomId };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Batch operations for bulk updates
   */
  async bulkUpdateRooms(updates: Partial<Room>[]): Promise<TransactionResult<string[]>> {
    try {
      const batch = writeBatch(db);
      const roomIds: string[] = [];

      for (const update of updates) {
        if (!update.id) continue;
        
        const roomRef = doc(db, 'rooms', update.id);
        batch.update(roomRef, {
          ...update,
          updatedAt: new Date()
        });
        roomIds.push(update.id);
      }

      await batch.commit();
      return { success: true, data: roomIds };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<TransactionResult<T>>,
    maxRetries: number = this.maxRetries
  ): Promise<TransactionResult<T>> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (result.success || !result.retryable) {
          return result;
        }
        
        lastError = result.error || 'Unknown error';
        
        if (attempt < maxRetries) {
          const delay = this.calculateBackoff(attempt);
          logger.warn(`Transaction attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
            error: lastError
          });
          await this.sleep(delay);
        }
      } catch (error: any) {
        lastError = error.message;
        if (attempt < maxRetries && this.isRetryableError(error)) {
          const delay = this.calculateBackoff(attempt);
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    return {
      success: false,
      error: `Transaction failed after ${maxRetries + 1} attempts: ${lastError}`,
      retryable: false
    };
  }

  private calculateBackoff(attempt: number): number {
    return this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'aborted',
      'internal',
      'cancelled'
    ];
    
    return retryableCodes.includes(error?.code) || 
           error?.message?.includes('network') ||
           error?.message?.includes('timeout');
  }
}

export const transactionManager = TransactionManager.getInstance();