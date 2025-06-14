
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const getRooms = async (): Promise<Room[]> => {
  try {
    console.log("🔍 FIRESTORE DEBUG: Starting getRooms()");
    console.log("🔍 FIRESTORE DEBUG: Database instance:", db);
    console.log("🔍 FIRESTORE DEBUG: Collection name:", ROOMS_COLLECTION);
    
    const roomsCollection = collection(db, ROOMS_COLLECTION);
    console.log("🔍 FIRESTORE DEBUG: Collection reference created:", roomsCollection);
    
    console.log("🔍 FIRESTORE DEBUG: Attempting to fetch documents...");
    const roomsSnapshot = await getDocs(roomsCollection);
    console.log("🔍 FIRESTORE DEBUG: Snapshot received:", roomsSnapshot);
    console.log("🔍 FIRESTORE DEBUG: Snapshot size:", roomsSnapshot.size);
    console.log("🔍 FIRESTORE DEBUG: Snapshot empty:", roomsSnapshot.empty);
    console.log("🔍 FIRESTORE DEBUG: Snapshot metadata:", roomsSnapshot.metadata);
    
    if (roomsSnapshot.empty) {
      console.warn("⚠️ FIRESTORE DEBUG: No rooms found in Firestore collection");
      console.log("🔍 FIRESTORE DEBUG: This could mean:");
      console.log("  - Collection doesn't exist");
      console.log("  - Collection is empty");
      console.log("  - Permission denied (check Firestore rules)");
      console.log("  - Network connectivity issues");
      return [];
    }
    
    const rooms: Room[] = [];
    console.log("🔍 FIRESTORE DEBUG: Processing documents...");
    
    let docIndex = 0;
    roomsSnapshot.forEach((doc) => {
      docIndex++;
      console.log(`🔍 FIRESTORE DEBUG: Processing document ${docIndex}/${roomsSnapshot.size}`);
      console.log(`🔍 FIRESTORE DEBUG: Document ID: ${doc.id}`);
      console.log(`🔍 FIRESTORE DEBUG: Document exists: ${doc.exists()}`);
      
      const data = doc.data();
      console.log(`🔍 FIRESTORE DEBUG: Document data:`, data);
      
      const room = { 
        id: doc.id, 
        ...data,
        availability: data.availability !== false,
        bookings: data.bookings || []
      } as Room;
      
      console.log(`🔍 FIRESTORE DEBUG: Processed room:`, room);
      rooms.push(room);
    });
    
    console.log("✅ FIRESTORE DEBUG: Successfully fetched rooms from Firestore:", rooms.length);
    console.log("✅ FIRESTORE DEBUG: Rooms data:", rooms);
    return rooms;
  } catch (error) {
    console.error("❌ FIRESTORE ERROR: Failed to fetch rooms");
    console.error("❌ FIRESTORE ERROR: Error type:", typeof error);
    console.error("❌ FIRESTORE ERROR: Error constructor:", error?.constructor?.name);
    console.error("❌ FIRESTORE ERROR: Error message:", (error as any)?.message);
    console.error("❌ FIRESTORE ERROR: Error code:", (error as any)?.code);
    console.error("❌ FIRESTORE ERROR: Error details:", (error as any)?.details);
    console.error("❌ FIRESTORE ERROR: Full error object:", error);
    console.error("❌ FIRESTORE ERROR: Error stack:", (error as any)?.stack);
    throw error;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    console.log(`🔍 FIRESTORE DEBUG: Starting getRoom() for ID: ${roomId}`);
    console.log("🔍 FIRESTORE DEBUG: Database instance:", db);
    console.log("🔍 FIRESTORE DEBUG: Collection name:", ROOMS_COLLECTION);
    
    const roomDocRef = doc(db, ROOMS_COLLECTION, roomId);
    console.log("🔍 FIRESTORE DEBUG: Document reference created:", roomDocRef);
    console.log("🔍 FIRESTORE DEBUG: Document path:", roomDocRef.path);
    
    console.log("🔍 FIRESTORE DEBUG: Attempting to fetch document...");
    const roomDoc = await getDoc(roomDocRef);
    console.log("🔍 FIRESTORE DEBUG: Document snapshot received:", roomDoc);
    console.log("🔍 FIRESTORE DEBUG: Document exists:", roomDoc.exists());
    console.log("🔍 FIRESTORE DEBUG: Document metadata:", roomDoc.metadata);
    
    if (!roomDoc.exists()) {
      console.warn(`⚠️ FIRESTORE DEBUG: Room document ${roomId} does not exist`);
      console.log("🔍 FIRESTORE DEBUG: This could mean:");
      console.log("  - Document was deleted");
      console.log("  - Document ID is incorrect");
      console.log("  - Permission denied for this specific document");
      return null;
    }
    
    const data = roomDoc.data();
    console.log(`🔍 FIRESTORE DEBUG: Document data for ${roomId}:`, data);
    
    const room = { 
      id: roomDoc.id, 
      ...data,
      availability: data.availability !== false,
      bookings: data.bookings || []
    } as Room;
    
    console.log(`✅ FIRESTORE DEBUG: Successfully fetched room ${roomId}:`, room);
    return room;
  } catch (error) {
    console.error(`❌ FIRESTORE ERROR: Failed to fetch room ${roomId}`);
    console.error("❌ FIRESTORE ERROR: Error type:", typeof error);
    console.error("❌ FIRESTORE ERROR: Error constructor:", error?.constructor?.name);
    console.error("❌ FIRESTORE ERROR: Error message:", (error as any)?.message);
    console.error("❌ FIRESTORE ERROR: Error code:", (error as any)?.code);
    console.error("❌ FIRESTORE ERROR: Error details:", (error as any)?.details);
    console.error("❌ FIRESTORE ERROR: Full error object:", error);
    console.error("❌ FIRESTORE ERROR: Error stack:", (error as any)?.stack);
    throw error;
  }
};
