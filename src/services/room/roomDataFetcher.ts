
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
  console.log("🏨 ROOM FETCHER: ================== STARTING ROOM DATA FETCH ==================");
  console.log("🏨 ROOM FETCHER: Starting fetchRoomData operation at:", new Date().toISOString());
  console.log("🏨 ROOM FETCHER: Function parameters:", {
    hasShownLocalDataToast,
    functionsProvided: {
      setRooms: typeof setRooms,
      setError: typeof setError,
      setUsingLocalData: typeof setUsingLocalData,
      setHasShownLocalDataToast: typeof setHasShownLocalDataToast
    }
  });
  
  try {
    // Step 1: Try direct Firestore query
    console.log("🏨 ROOM FETCHER: ================== STEP 1: DIRECT FIRESTORE QUERY ==================");
    console.log("🏨 ROOM FETCHER: About to call fetchRoomsDirectly()...");
    
    let roomsData;
    try {
      roomsData = await fetchRoomsDirectly();
      console.log("🏨 ROOM FETCHER: ✅ fetchRoomsDirectly() completed successfully");
      console.log("🏨 ROOM FETCHER: Direct query results:", {
        isArray: Array.isArray(roomsData),
        length: roomsData?.length || 0,
        firstRoom: roomsData?.[0] || 'No rooms',
        dataType: typeof roomsData
      });
    } catch (directError) {
      console.error("🏨 ROOM FETCHER: ❌ fetchRoomsDirectly() threw an error:", directError);
      console.error("🏨 ROOM FETCHER: Error details:", {
        name: directError?.name,
        message: directError?.message,
        code: directError?.code,
        stack: directError?.stack
      });
      roomsData = null; // Set to null to trigger next step
    }
    
    if (roomsData && Array.isArray(roomsData) && roomsData.length > 0) {
      console.log("🏨 ROOM FETCHER: ✅ SUCCESS: Direct query returned valid data");
      console.log("🏨 ROOM FETCHER: Rooms found:", roomsData.map(r => ({ id: r.id, name: r.name })));
      setRooms(roomsData);
      setError(null);
      setUsingLocalData(false);
      console.log("🏨 ROOM FETCHER: ================== RETURNING FROM STEP 1 ==================");
      return roomsData;
    } else {
      console.log("🏨 ROOM FETCHER: ⚠️ Direct query did not return valid data:", {
        roomsData,
        isArray: Array.isArray(roomsData),
        length: roomsData?.length
      });
    }
    
    // Step 2: Try through service layer
    console.log("🏨 ROOM FETCHER: ================== STEP 2: SERVICE LAYER QUERY ==================");
    console.log("🏨 ROOM FETCHER: About to call fetchRoomsFromService()...");
    
    let serviceFetchedRooms;
    try {
      serviceFetchedRooms = await fetchRoomsFromService();
      console.log("🏨 ROOM FETCHER: ✅ fetchRoomsFromService() completed successfully");
      console.log("🏨 ROOM FETCHER: Service query results:", {
        isArray: Array.isArray(serviceFetchedRooms),
        length: serviceFetchedRooms?.length || 0,
        firstRoom: serviceFetchedRooms?.[0] || 'No rooms',
        dataType: typeof serviceFetchedRooms
      });
    } catch (serviceError) {
      console.error("🏨 ROOM FETCHER: ❌ fetchRoomsFromService() threw an error:", serviceError);
      console.error("🏨 ROOM FETCHER: Service error details:", {
        name: serviceError?.name,
        message: serviceError?.message,
        code: serviceError?.code,
        stack: serviceError?.stack
      });
      serviceFetchedRooms = null;
    }
    
    if (serviceFetchedRooms && Array.isArray(serviceFetchedRooms) && serviceFetchedRooms.length > 0) {
      console.log("🏨 ROOM FETCHER: ✅ SUCCESS: Service query returned valid data");
      console.log("🏨 ROOM FETCHER: Rooms found:", serviceFetchedRooms.map(r => ({ id: r.id, name: r.name })));
      setRooms(serviceFetchedRooms);
      setError(null);
      setUsingLocalData(false);
      console.log("🏨 ROOM FETCHER: ================== RETURNING FROM STEP 2 ==================");
      return serviceFetchedRooms;
    } else {
      console.log("🏨 ROOM FETCHER: ⚠️ Service query did not return valid data:", {
        serviceFetchedRooms,
        isArray: Array.isArray(serviceFetchedRooms),
        length: serviceFetchedRooms?.length
      });
    }
    
    // Step 3: Auto-seed database if empty
    console.log("🏨 ROOM FETCHER: ================== STEP 3: AUTO-SEEDING DATABASE ==================");
    console.log("🏨 ROOM FETCHER: About to call seedRoomDatabase()...");
    
    let seededRooms;
    try {
      seededRooms = await seedRoomDatabase();
      console.log("🏨 ROOM FETCHER: ✅ seedRoomDatabase() completed");
      console.log("🏨 ROOM FETCHER: Seeding results:", {
        isArray: Array.isArray(seededRooms),
        length: seededRooms?.length || 0,
        firstRoom: seededRooms?.[0] || 'No rooms',
        dataType: typeof seededRooms
      });
    } catch (seedError) {
      console.error("🏨 ROOM FETCHER: ❌ seedRoomDatabase() threw an error:", seedError);
      console.error("🏨 ROOM FETCHER: Seeding error details:", {
        name: seedError?.name,
        message: seedError?.message,
        code: seedError?.code,
        stack: seedError?.stack
      });
      seededRooms = null;
    }
    
    if (seededRooms && Array.isArray(seededRooms) && seededRooms.length > 0) {
      console.log("🏨 ROOM FETCHER: ✅ SUCCESS: Auto-seeding returned valid data");
      console.log("🏨 ROOM FETCHER: Seeded rooms:", seededRooms.map(r => ({ id: r.id, name: r.name })));
      setRooms(seededRooms);
      setError(null);
      setUsingLocalData(false);
      console.log("🏨 ROOM FETCHER: ================== RETURNING FROM STEP 3 ==================");
      return seededRooms;
    } else {
      console.log("🏨 ROOM FETCHER: ⚠️ Auto-seeding did not return valid data:", {
        seededRooms,
        isArray: Array.isArray(seededRooms),
        length: seededRooms?.length
      });
    }
    
    // Step 4: Use fallback data
    console.log("🏨 ROOM FETCHER: ================== STEP 4: USING FALLBACK DATA ==================");
    console.log("🏨 ROOM FETCHER: All previous steps failed, using fallback room data");
    console.log("🏨 ROOM FETCHER: Fallback data details:", {
      isArray: Array.isArray(fallbackRooms),
      length: fallbackRooms?.length || 0,
      firstRoom: fallbackRooms?.[0] || 'No rooms',
      roomIds: fallbackRooms?.map(r => r.id) || []
    });
    
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError(null);
    console.log("🏨 ROOM FETCHER: ⚠️ Set usingLocalData to TRUE - this will show the demo data banner");
    console.log("🏨 ROOM FETCHER: ================== RETURNING FALLBACK DATA ==================");
    return fallbackRooms;
    
  } catch (err) {
    console.error("🏨 ROOM FETCHER: ❌ ================== CRITICAL ERROR IN FETCHROOMDATA ==================");
    console.error("🏨 ROOM FETCHER: Unexpected error in fetchRoomData:", err);
    console.error("🏨 ROOM FETCHER: Error details:", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
      type: typeof err
    });
    
    // Even on error, provide fallback data
    console.log("🏨 ROOM FETCHER: ⚠️ Error occurred, using fallback data as safety net");
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError("Using demo room data. Connect to Firestore to see live data.");
    console.log("🏨 ROOM FETCHER: ⚠️ Set usingLocalData to TRUE due to error - this will show the demo data banner");
    console.log("🏨 ROOM FETCHER: ================== RETURNING FALLBACK DATA DUE TO ERROR ==================");
    return fallbackRooms;
  }
};
