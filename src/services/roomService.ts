/**
 * Centralized room service for all room-related operations
 * Handles room data fetching, filtering, availability checking, and management
 */

import { Room, BookingPeriod, RoomAvailabilityCheck } from "@/types/hotel.types";
import { getRooms as fetchRooms, getRoom as fetchRoom } from "./room/roomQueries";
import { saveRoom, saveRooms, deleteRoom, addBookingToRoom } from "./room/roomMutations";
import { seedRooms } from "./room/roomSeed";
import { getAvailableRooms } from "./room/roomAvailability";
import { addNoteToBooking, addChargeToBooking, getBookingIssues } from "./room/roomIssueTracking";
import { checkRoomAvailability } from "@/utils/availabilityUtils";

export interface RoomSearchFilters {
  guests: number;
  period: BookingPeriod;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  bedType?: string;
}

export interface RoomSearchResult {
  rooms: Room[];
  availability: Record<string, RoomAvailabilityCheck>;
  totalCount: number;
  filteredCount: number;
}

/**
 * Room service class for managing room operations
 */
export class RoomService {
  private static instance: RoomService;
  private roomCache: Room[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): RoomService {
    if (!RoomService.instance) {
      RoomService.instance = new RoomService();
    }
    return RoomService.instance;
  }

  /**
   * Get all rooms with caching
   */
  async getAllRooms(forceRefresh: boolean = false): Promise<Room[]> {
    const now = Date.now();
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.roomCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log("Returning cached room data");
      return this.roomCache;
    }

    try {
      console.log("Fetching fresh room data");
      const rooms = await fetchRooms();
      
      // Update cache
      this.roomCache = rooms;
      this.cacheTimestamp = now;
      
      return rooms;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      
      // Return cached data if available, even if stale
      if (this.roomCache.length > 0) {
        console.log("Returning stale cached data due to fetch error");
        return this.roomCache;
      }
      
      throw error;
    }
  }

  /**
   * Get a single room by ID
   */
  async getRoom(roomId: string): Promise<Room | null> {
    try {
      return await fetchRoom(roomId);
    } catch (error) {
      console.error(`Error fetching room ${roomId}:`, error);
      
      // Try to find in cache as fallback
      const cachedRoom = this.roomCache.find(room => room.id === roomId);
      return cachedRoom || null;
    }
  }

  /**
   * Search and filter rooms based on criteria
   */
  async searchRooms(filters: RoomSearchFilters): Promise<RoomSearchResult> {
    try {
      const allRooms = await this.getAllRooms();
      
      // Apply filters
      let filteredRooms = allRooms.filter(room => {
        // Basic capacity filter
        if (room.capacity < filters.guests) {
          return false;
        }

        // Price filters
        if (filters.minPrice && room.price < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice && room.price > filters.maxPrice) {
          return false;
        }

        // Bed type filter
        if (filters.bedType && room.bed !== filters.bedType) {
          return false;
        }

        // Amenities filter
        if (filters.amenities && filters.amenities.length > 0) {
          const hasAllAmenities = filters.amenities.every(amenity => 
            room.amenities.includes(amenity)
          );
          if (!hasAllAmenities) {
            return false;
          }
        }

        return true;
      });

      // Check availability for filtered rooms
      const availability: Record<string, RoomAvailabilityCheck> = {};
      filteredRooms.forEach(room => {
        availability[room.id] = checkRoomAvailability(room, filters.period);
      });

      // Filter out unavailable rooms
      filteredRooms = filteredRooms.filter(room => availability[room.id]?.isAvailable !== false);

      return {
        rooms: filteredRooms,
        availability,
        totalCount: allRooms.length,
        filteredCount: filteredRooms.length
      };
    } catch (error) {
      console.error("Error searching rooms:", error);
      throw error;
    }
  }

  /**
   * Save a single room
   */
  async saveRoom(room: Room): Promise<void> {
    try {
      await saveRoom(room);
      this.invalidateCache();
    } catch (error) {
      console.error("Error saving room:", error);
      throw error;
    }
  }

  /**
   * Save multiple rooms
   */
  async saveRooms(rooms: Room[]): Promise<void> {
    try {
      await saveRooms(rooms);
      this.invalidateCache();
    } catch (error) {
      console.error("Error saving rooms:", error);
      throw error;
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId: string): Promise<void> {
    try {
      await deleteRoom(roomId);
      this.invalidateCache();
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  }

  /**
   * Get rooms by availability
   */
  async getAvailableRooms(period: BookingPeriod, guests: number): Promise<Room[]> {
    const searchResult = await this.searchRooms({ guests, period });
    return searchResult.rooms;
  }

  /**
   * Seed initial room data
   */
  async seedRooms(): Promise<void> {
    try {
      await seedRooms();
      this.invalidateCache();
    } catch (error) {
      console.error("Error seeding rooms:", error);
      throw error;
    }
  }

  /**
   * Invalidate the room cache
   */
  private invalidateCache(): void {
    this.roomCache = [];
    this.cacheTimestamp = 0;
    console.log("Room cache invalidated");
  }

  /**
   * Get room statistics
   */
  async getRoomStatistics(): Promise<{
    totalRooms: number;
    availableRooms: number;
    averagePrice: number;
    maxCapacity: number;
  }> {
    const rooms = await this.getAllRooms();
    
    return {
      totalRooms: rooms.length,
      availableRooms: rooms.filter(room => room.availability).length,
      averagePrice: rooms.reduce((sum, room) => sum + room.price, 0) / rooms.length,
      maxCapacity: Math.max(...rooms.map(room => room.capacity))
    };
  }
}

// Export singleton instance and individual functions for backward compatibility
export const roomService = RoomService.getInstance();

// Re-export functions for backward compatibility
export {
  fetchRooms as getRooms,
  fetchRoom as getRoom,
  saveRoom,
  saveRooms,
  deleteRoom,
  seedRooms,
  getAvailableRooms,
  addBookingToRoom,
  addNoteToBooking,
  addChargeToBooking,
  getBookingIssues
};