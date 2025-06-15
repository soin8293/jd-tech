import { Room } from "@/types/hotel.types";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";
import { getRooms as fetchRoomsFromService } from "@/services/room/roomService";
import { seedRoomDatabase } from "./roomSeeding";
import { fallbackRooms } from "@/data/fallbackRooms";

/**
 * Primary room fetching logic with multiple fallback strategies
 */
export const fetchRoomData = async (
  setRooms: (rooms: Room[]) => void,
  setError: (error: string | null) => void,
  setUsingLocalData: (value: boolean) => void,
  hasShownLocalDataToast: boolean,
  setHasShownLocalDataToast: (value: boolean) => void
): Promise<Room[]> => {
  console.log("🏨 ROOM FETCHER: Starting fetchRoomData operation");
  console.log("🏨 ROOM FETCHER: hasShownLocalDataToast:", hasShownLocalDataToast);
  
  try {
    // Step 1: Try direct Firestore query
    console.log("🏨 ROOM FETCHER: Step 1 - Trying direct Firestore query...");
    const roomsData = await fetchRoomsDirectly();
    console.log("🏨 ROOM FETCHER: Direct query results count:", roomsData?.length || 0);
    
    if (roomsData && roomsData.length > 0) {
      console.log("✅ ROOM FETCHER: Direct query successful");
      setRooms(roomsData);
      setError(null);
      setUsingLocalData(false);
      return roomsData;
    }
    
    // Step 2: Try through service layer
    console.log("🏨 ROOM FETCHER: Step 2 - Trying through service layer...");
    const serviceFetchedRooms = await fetchRoomsFromService();
    console.log("🏨 ROOM FETCHER: Service query results count:", serviceFetchedRooms?.length || 0);
    
    if (serviceFetchedRooms && serviceFetchedRooms.length > 0) {
      console.log("✅ ROOM FETCHER: Service query successful");
      setRooms(serviceFetchedRooms);
      setError(null);
      setUsingLocalData(false);
      return serviceFetchedRooms;
    }
    
    // Step 3: Auto-seed database if empty
    console.log("🏨 ROOM FETCHER: Step 3 - Database appears empty, attempting auto-seed...");
    const seededRooms = await seedRoomDatabase();
    
    if (seededRooms && seededRooms.length > 0) {
      console.log("✅ ROOM FETCHER: Auto-seeding successful");
      setRooms(seededRooms);
      setError(null);
      setUsingLocalData(false);
      return seededRooms;
    }
    
    // Step 4: Use fallback data
    console.log("🏨 ROOM FETCHER: Step 4 - Using fallback room data");
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError(null);
    return fallbackRooms;
    
  } catch (err) {
    console.error("❌ ROOM FETCHER: Error in fetchRoomData:", err);
    
    // Even on error, provide fallback data
    console.log("🏨 ROOM FETCHER: Error occurred, using fallback data as safety net");
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError("Using demo room data. Connect to Firestore to see live data.");
    return fallbackRooms;
  }
};