import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookingPeriod, Room, RoomAvailabilityCheck } from "@/types/hotel.types";
import { checkRoomAvailability } from "@/utils/availabilityUtils";
import { fetchRoomData } from "@/utils/roomDataOperations";
// Native debounce implementation
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  amenities?: string[];
}

interface CachedSearchResult {
  key: string;
  rooms: Room[];
  availability: Record<string, RoomAvailabilityCheck>;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ITEMS_PER_PAGE = 6;

export const useOptimizedRoomSearch = () => {
  const { toast } = useToast();
  
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomAvailabilityCheck>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [usingLocalData, setUsingLocalData] = useState(false);
  const [searchCache] = useState(new Map<string, CachedSearchResult>());

  // Load rooms with caching
  useEffect(() => {
    const cachedRooms = sessionStorage.getItem('hotel-rooms');
    const cacheTimestamp = sessionStorage.getItem('hotel-rooms-timestamp');
    
    if (cachedRooms && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp);
      if (age < CACHE_TTL) {
        setAllRooms(JSON.parse(cachedRooms));
        return;
      }
    }

    const loadRooms = async () => {
      setIsLoading(true);
      try {
        const fetchedRooms = await fetchRoomData(
          (rooms) => {
            setAllRooms(rooms);
            sessionStorage.setItem('hotel-rooms', JSON.stringify(rooms));
            sessionStorage.setItem('hotel-rooms-timestamp', Date.now().toString());
          },
          (error) => console.error("Room loading error:", error),
          setUsingLocalData,
          false,
          () => {}
        );
      } catch (error) {
        console.error("Error loading rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (
      period: BookingPeriod,
      guestCount: number,
      filters: SearchFilters = {}
    ) => {
      const cacheKey = JSON.stringify({ period, guestCount, filters });
      
      // Check cache first
      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setFilteredRooms(cached.rooms);
        setRoomAvailability(cached.availability);
        setCurrentPage(1);
        setIsLoading(false);
        return;
      }

      try {
        // Filter rooms
        let rooms = allRooms.filter(room => {
          if (room.capacity < guestCount) return false;
          if (filters.minPrice && room.price < filters.minPrice) return false;
          if (filters.maxPrice && room.price > filters.maxPrice) return false;
          return true;
        });

        // Check availability
        const availabilityChecks: Record<string, RoomAvailabilityCheck> = {};
        rooms.forEach(room => {
          availabilityChecks[room.id] = checkRoomAvailability(room, period);
        });

        // Cache results
        const result: CachedSearchResult = {
          key: cacheKey,
          rooms,
          availability: availabilityChecks,
          timestamp: Date.now()
        };
        searchCache.set(cacheKey, result);

        setFilteredRooms(rooms);
        setRoomAvailability(availabilityChecks);
        setCurrentPage(1);
        setHasSearched(true);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Failed",
          description: "Unable to search rooms. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [allRooms, searchCache, toast]
  );

  const searchRooms = useCallback((
    period: BookingPeriod,
    guestCount: number,
    filters: SearchFilters = {}
  ) => {
    setIsLoading(true);
    debouncedSearch(period, guestCount, filters);
  }, [debouncedSearch]);

  // Paginated results
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredRooms.slice(start, end);
  }, [filteredRooms, currentPage]);

  const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);

  return {
    // Room data
    paginatedRooms,
    roomAvailability,
    
    // State
    isLoading,
    hasSearched,
    usingLocalData,
    
    // Pagination
    currentPage,
    totalPages,
    totalResults: filteredRooms.length,
    setCurrentPage,
    
    // Actions
    searchRooms,
    
    // Cache management
    clearCache: () => {
      searchCache.clear();
      sessionStorage.removeItem('hotel-rooms');
      sessionStorage.removeItem('hotel-rooms-timestamp');
    }
  };
};