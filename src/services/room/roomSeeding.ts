import { getFunctions, httpsCallable } from "firebase/functions";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";
import { Room } from "@/types/hotel.types";

const functions = getFunctions();

/**
 * Attempts to seed the database with initial room data
 * Returns the seeded rooms if successful, null if failed
 */
export const seedRoomDatabase = async (): Promise<Room[] | null> => {
  console.log("🏨 ROOM SEEDING: Starting database seeding...");
  
  try {
    const seedFunction = httpsCallable(functions, 'seedDatabase');
    console.log("🏨 ROOM SEEDING: Calling seedDatabase function...");
    
    // Set a timeout for the function call
    const result = await Promise.race([
      seedFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Function call timeout')), 10000)
      )
    ]);
    
    console.log("🏨 ROOM SEEDING: SeedDatabase result:", (result as any)?.data);
    
    // After seeding, try to fetch the seeded rooms
    console.log("🏨 ROOM SEEDING: Attempting to fetch rooms after seeding...");
    const freshRooms = await fetchRoomsDirectly();
    
    if (freshRooms && freshRooms.length > 0) {
      console.log("✅ ROOM SEEDING: Successfully fetched seeded rooms");
      return freshRooms;
    }
    
    console.warn("⚠️ ROOM SEEDING: Seeding function succeeded but no rooms returned");
    return null;
  } catch (seedError) {
    console.error("❌ ROOM SEEDING: Auto-seeding failed:", seedError);
    console.error("❌ ROOM SEEDING: This could be due to:");
    console.error("  - Cloud Function not deployed");
    console.error("  - CORS issues");
    console.error("  - Network connectivity");
    console.error("  - Function timeout");
    return null;
  }
};