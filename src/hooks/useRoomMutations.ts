
import { useState, useCallback } from "react";
import { Room } from "@/types/hotel.types";
import { transactionManager } from "@/utils/transactionManager";
import { useOptimisticUpdates } from "./useOptimisticUpdates";
import { useOfflineQueue } from "./useOfflineQueue";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export const useRoomMutations = (
  initialRooms: Room[],
  setRooms: (rooms: Room[]) => void
) => {
  const [loading, setLoading] = useState(false);
  
  const {
    data: optimisticRooms,
    executeOptimistic,
    hasPendingOperations,
    isProcessing,
    getPendingOperation
  } = useOptimisticUpdates(initialRooms);

  const {
    isOnline,
    queueOperation,
    queueSize,
    isProcessingQueue
  } = useOfflineQueue();

  // Sync optimistic data with parent state
  const syncWithParent = useCallback(() => {
    setRooms(optimisticRooms);
  }, [optimisticRooms, setRooms]);

  // Handle save rooms with atomic transactions and optimistic updates
  const handleSaveRooms = useCallback(async (rooms: Room[]) => {
    logger.info('Starting room save operation', { 
      roomCount: rooms.length,
      isOnline,
      hasPendingOperations 
    });

    try {
      setLoading(true);

      if (!isOnline) {
        // Queue operation for offline processing
        await queueOperation({
          type: 'save',
          data: rooms,
          maxRetries: 3
        });
        
        // Update local state immediately for better UX
        setRooms(rooms);
        return;
      }

      // Create optimistic operations for each room
      const operations = rooms.map(room => ({
        id: `save_${room.id}_${Date.now()}`,
        type: 'update' as const,
        optimisticData: { ...room, updatedAt: new Date() },
        rollbackData: initialRooms.find(r => r.id === room.id),
        operation: () => transactionManager.saveRoomAtomically(room)
      }));

      // Execute all optimistic operations
      await Promise.all(operations.map(op => executeOptimistic(op)));

      // Sync with parent component
      syncWithParent();

      toast({
        title: "Rooms Saved",
        description: `Successfully saved ${rooms.length} room(s)`,
      });

    } catch (error: any) {
      logger.error('Room save operation failed', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    isOnline,
    queueOperation,
    executeOptimistic,
    initialRooms,
    setRooms,
    syncWithParent
  ]);

  // Handle delete room with conflict checking
  const handleDeleteRoom = useCallback(async (roomId: string) => {
    logger.info('Starting room deletion', { roomId, isOnline });

    try {
      setLoading(true);
      const roomToDelete = optimisticRooms.find(r => r.id === roomId);
      
      if (!roomToDelete) {
        throw new Error('Room not found');
      }

      if (!isOnline) {
        // Queue operation for offline processing
        await queueOperation({
          type: 'delete',
          data: roomId,
          maxRetries: 3
        });
        
        // Update local state immediately
        setRooms(optimisticRooms.filter(r => r.id !== roomId));
        return;
      }

      // Create optimistic delete operation
      const operation = {
        id: `delete_${roomId}_${Date.now()}`,
        type: 'delete' as const,
        optimisticData: roomToDelete,
        rollbackData: roomToDelete,
        operation: () => transactionManager.deleteRoomAtomically(roomId)
      };

      await executeOptimistic(operation);
      syncWithParent();

      toast({
        title: "Room Deleted",
        description: `Room "${roomToDelete.name}" has been deleted`,
      });

    } catch (error: any) {
      logger.error('Room deletion failed', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    isOnline,
    queueOperation,
    executeOptimistic,
    optimisticRooms,
    setRooms,
    syncWithParent
  ]);

  // Check if a specific room operation is pending
  const isRoomPending = useCallback((roomId: string) => {
    return !!getPendingOperation(roomId);
  }, [getPendingOperation]);

  return {
    loading: loading || isProcessing || isProcessingQueue,
    handleSaveRooms,
    handleDeleteRoom,
    isRoomPending,
    connectionStatus: {
      isOnline,
      hasPendingOperations,
      queueSize,
      isProcessingQueue
    }
  };
};
