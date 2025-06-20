
import { getFunctions, httpsCallable } from "firebase/functions";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";
import { Room } from "@/types/hotel.types";
import { auth, functions } from "@/lib/firebase";

/**
 * Attempts to seed the database with initial room data
 * Returns the seeded rooms if successful, null if failed
 */
export const seedRoomDatabase = async (): Promise<Room[] | null> => {
  console.log("🌱 SEEDING: ================== STARTING DATABASE SEEDING ==================");
  console.log("🌱 SEEDING: Starting database seeding at:", new Date().toISOString());
  
  // Check if Firebase is properly initialized
  if (!auth || !functions) {
    console.error("🌱 SEEDING: ❌ Firebase is not properly initialized");
    console.error("🌱 SEEDING: This is likely due to missing Firebase configuration");
    console.error("🌱 SEEDING: Please check your environment variables");
    return null;
  }
  
  console.log("🌱 SEEDING: Functions instance:", functions);
  console.log("🌱 SEEDING: Functions app:", functions.app);
  
  try {
    console.log("🌱 SEEDING: Creating seedDatabase callable function...");
    const seedFunction = httpsCallable(functions, 'seedDatabase');
    console.log("🌱 SEEDING: Function created successfully:", seedFunction);
    
    console.log("🌱 SEEDING: About to call seedDatabase function...");
    const startTime = Date.now();
    
    // Set a timeout for the function call
    const result = await Promise.race([
      seedFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Function call timeout after 10 seconds')), 10000)
      )
    ]);
    
    const endTime = Date.now();
    console.log("🌱 SEEDING: ✅ SeedDatabase function completed in:", (endTime - startTime), "ms");
    console.log("🌱 SEEDING: Function result:", result);
    console.log("🌱 SEEDING: Result data:", (result as any)?.data);
    console.log("🌱 SEEDING: Result data type:", typeof (result as any)?.data);
    console.log("🌱 SEEDING: Result data success:", (result as any)?.data?.success);
    console.log("🌱 SEEDING: Result data message:", (result as any)?.data?.message);
    
    // After seeding, try to fetch the seeded rooms
    console.log("🌱 SEEDING: ================== FETCHING ROOMS AFTER SEEDING ==================");
    console.log("🌱 SEEDING: Attempting to fetch rooms after seeding...");
    
    // Wait a moment for the database to be consistent
    console.log("🌱 SEEDING: Waiting 1 second for database consistency...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("🌱 SEEDING: About to call fetchRoomsDirectly()...");
    const fetchStartTime = Date.now();
    const freshRooms = await fetchRoomsDirectly();
    const fetchEndTime = Date.now();
    
    console.log("🌱 SEEDING: fetchRoomsDirectly completed in:", (fetchEndTime - fetchStartTime), "ms");
    console.log("🌱 SEEDING: Fresh rooms result:", {
      isArray: Array.isArray(freshRooms),
      length: freshRooms?.length || 0,
      dataType: typeof freshRooms,
      firstRoom: freshRooms?.[0] || 'No rooms',
      roomIds: freshRooms?.map(r => r.id) || []
    });
    
    if (freshRooms && Array.isArray(freshRooms) && freshRooms.length > 0) {
      console.log("🌱 SEEDING: ✅ ================== SUCCESS: SEEDED ROOMS FETCHED ==================");
      console.log("🌱 SEEDING: Successfully fetched", freshRooms.length, "seeded rooms");
      console.log("🌱 SEEDING: Room details:", freshRooms.map(r => ({ id: r.id, name: r.name, price: r.price })));
      console.log("🌱 SEEDING: ================== RETURNING SEEDED ROOMS ==================");
      return freshRooms;
    } else {
      console.warn("🌱 SEEDING: ⚠️ ================== SEEDING FUNCTION SUCCEEDED BUT NO ROOMS FOUND ==================");
      console.warn("🌱 SEEDING: Seeding function succeeded but no rooms returned from fetch");
      console.warn("🌱 SEEDING: This could mean:");
      console.warn("🌱 SEEDING:   - Database seeding failed silently");
      console.warn("🌱 SEEDING:   - Firestore rules preventing read access");
      console.warn("🌱 SEEDING:   - Network issues during fetch");
      console.warn("🌱 SEEDING:   - Collection name mismatch");
      console.log("🌱 SEEDING: ================== RETURNING NULL ==================");
      return null;
    }
    
  } catch (seedError) {
    console.error("🌱 SEEDING: ❌ ================== SEEDING ERROR ==================");
    console.error("🌱 SEEDING: Auto-seeding failed with error:", seedError);
    console.error("🌱 SEEDING: Error type:", typeof seedError);
    console.error("🌱 SEEDING: Error constructor:", seedError?.constructor?.name);
    console.error("🌱 SEEDING: Error message:", (seedError as any)?.message);
    console.error("🌱 SEEDING: Error code:", (seedError as any)?.code);
    console.error("🌱 SEEDING: Error details:", (seedError as any)?.details);
    console.error("🌱 SEEDING: Full error object:", seedError);
    console.error("🌱 SEEDING: Error stack:", (seedError as any)?.stack);
    
    console.error("🌱 SEEDING: This could be due to:");
    console.error("🌱 SEEDING:   - Cloud Function not deployed");
    console.error("🌱 SEEDING:   - CORS issues");
    console.error("🌱 SEEDING:   - Network connectivity problems");
    console.error("🌱 SEEDING:   - Function timeout (>10 seconds)");
    console.error("🌱 SEEDING:   - Firebase project configuration issues");
    console.error("🌱 SEEDING:   - Authentication/permission problems");
    console.log("🌱 SEEDING: ================== RETURNING NULL DUE TO ERROR ==================");
    return null;
  }
};
