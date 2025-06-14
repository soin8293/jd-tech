/**
 * Custom hook for room search and filtering functionality
 * Manages room search state, filters, and provides search results
 */

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Room, BookingPeriod, RoomAvailabilityCheck } from "@/types/hotel.types";
import { roomService, RoomSearchFilters, RoomSearchResult } from "@/services/roomService";

export interface UseRoomSearchReturn {
  // State
  searchResults: Room[];
  roomAvailability: Record<string, RoomAvailabilityCheck>;
  isLoading: boolean;
  isSearched: boolean;
  searchFilters: RoomSearchFilters | null;
  totalRoomsCount: number;
  filteredRoomsCount: number;
  
  // Actions
  searchRooms: (period: BookingPeriod, guests: number, additionalFilters?: Partial<RoomSearchFilters>) => Promise<void>;
  clearSearch: () => void;
  refineSearch: (additionalFilters: Partial<RoomSearchFilters>) => Promise<void>;
  
  // Helpers
  getRoomAvailability: (roomId: string) => RoomAvailabilityCheck | undefined;
}

export const useRoomSearch = (): UseRoomSearchReturn => {
  const { toast } = useToast();
  
  // State
  const [searchResults, setSearchResults] = useState<Room[]>([]);
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomAvailabilityCheck>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearched, setIsSearched] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<RoomSearchFilters | null>(null);
  const [totalRoomsCount, setTotalRoomsCount] = useState<number>(0);
  const [filteredRoomsCount, setFilteredRoomsCount] = useState<number>(0);

  /**
   * Perform room search with filters
   */
  const searchRooms = useCallback(async (
    period: BookingPeriod,
    guests: number,
    additionalFilters: Partial<RoomSearchFilters> = {}
  ) => {
    setIsLoading(true);
    
    try {
      const filters: RoomSearchFilters = {
        period,
        guests,
        ...additionalFilters
      };
      
      console.log("Searching rooms with filters:", filters);
      
      const result: RoomSearchResult = await roomService.searchRooms(filters);
      
      // Update state
      setSearchResults(result.rooms);
      setRoomAvailability(result.availability);
      setSearchFilters(filters);
      setTotalRoomsCount(result.totalCount);
      setFilteredRoomsCount(result.filteredCount);
      setIsSearched(true);
      
      // Show search results toast
      if (result.rooms.length === 0) {
        toast({
          title: "No Rooms Found",
          description: "No rooms match your search criteria. Try adjusting your filters.",
          variant: "default",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${result.rooms.length} available room${result.rooms.length !== 1 ? 's' : ''} for your dates.`,
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error("Error searching rooms:", error);
      
      // Clear results on error
      setSearchResults([]);
      setRoomAvailability({});
      setTotalRoomsCount(0);
      setFilteredRoomsCount(0);
      
      toast({
        title: "Search Failed",
        description: "Unable to search rooms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Clear search results and reset state
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setRoomAvailability({});
    setIsSearched(false);
    setSearchFilters(null);
    setTotalRoomsCount(0);
    setFilteredRoomsCount(0);
  }, []);

  /**
   * Refine existing search with additional filters
   */
  const refineSearch = useCallback(async (additionalFilters: Partial<RoomSearchFilters>) => {
    if (!searchFilters) {
      console.warn("Cannot refine search: no existing search filters");
      return;
    }
    
    await searchRooms(
      searchFilters.period,
      searchFilters.guests,
      { ...searchFilters, ...additionalFilters }
    );
  }, [searchFilters, searchRooms]);

  /**
   * Get availability for a specific room
   */
  const getRoomAvailability = useCallback((roomId: string): RoomAvailabilityCheck | undefined => {
    return roomAvailability[roomId];
  }, [roomAvailability]);

  return {
    // State
    searchResults,
    roomAvailability,
    isLoading,
    isSearched,
    searchFilters,
    totalRoomsCount,
    filteredRoomsCount,
    
    // Actions
    searchRooms,
    clearSearch,
    refineSearch,
    
    // Helpers
    getRoomAvailability
  };
};