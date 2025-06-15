import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const getRooms = async (): Promise<Room[]> => {
  console.log("🔍 FIRESTORE QUERY: ================== STARTING GETROOMS ==================");
  console.log("🔍 FIRESTORE QUERY: Starting getRooms() at:", new Date().toISOString());
  console.log("🔍 FIRESTORE QUERY: Database instance:", db);
  console.log("🔍 FIRESTORE QUERY: Database app:", db?.app);
  console.log("🔍 FIRESTORE QUERY: Database app options:", db?.app?.options);
  console.log("🔍 FIRESTORE QUERY: Collection name:", ROOMS_COLLECTION);
  
  try {
    console.log("🔍 FIRESTORE QUERY: Creating collection reference...");
    const roomsCollection = collection(db, ROOMS_COLLECTION);
    console.log("🔍 FIRESTORE QUERY: Collection reference created:", roomsCollection);
    console.log("🔍 FIRESTORE QUERY: Collection path:", roomsCollection.path);
    console.log("🔍 FIRESTORE QUERY: Collection id:", roomsCollection.id);
    console.log("🔍 FIRESTORE QUERY: Collection firestore:", roomsCollection.firestore);
    
    console.log("🔍 FIRESTORE QUERY: About to call getDocs()...");
    const startTime = Date.now();
    const roomsSnapshot = await getDocs(roomsCollection);
    const endTime = Date.now();
    
    console.log("🔍 FIRESTORE QUERY: ✅ getDocs() completed successfully");
    console.log("🔍 FIRESTORE QUERY: Query execution time:", (endTime - startTime), "ms");
    console.log("🔍 FIRESTORE QUERY: Snapshot received:", roomsSnapshot);
    console.log("🔍 FIRESTORE QUERY: Snapshot size:", roomsSnapshot.size);
    console.log("🔍 FIRESTORE QUERY: Snapshot empty:", roomsSnapshot.empty);
    console.log("🔍 FIRESTORE QUERY: Snapshot metadata:", roomsSnapshot.metadata);
    console.log("🔍 FIRESTORE QUERY: Snapshot metadata fromCache:", roomsSnapshot.metadata?.fromCache);
    console.log("🔍 FIRESTORE QUERY: Snapshot metadata hasPendingWrites:", roomsSnapshot.metadata?.hasPendingWrites);
    
    if (roomsSnapshot.empty) {
      console.warn("🔍 FIRESTORE QUERY: ⚠️ ================== SNAPSHOT IS EMPTY ==================");
      console.warn("🔍 FIRESTORE QUERY: No rooms found in Firestore collection");
      console.log("🔍 FIRESTORE QUERY: This could mean:");
      console.log("🔍 FIRESTORE QUERY:   - Collection doesn't exist");
      console.log("🔍 FIRESTORE QUERY:   - Collection is empty");
      console.log("🔍 FIRESTORE QUERY:   - Permission denied (check Firestore rules)");
      console.log("🔍 FIRESTORE QUERY:   - Network connectivity issues");
      console.log("🔍 FIRESTORE QUERY: ================== RETURNING EMPTY ARRAY ==================");
      return [];
    }
    
    const rooms: Room[] = [];
    console.log("🔍 FIRESTORE QUERY: ================== PROCESSING DOCUMENTS ==================");
    console.log("🔍 FIRESTORE QUERY: Processing", roomsSnapshot.size, "documents...");
    
    let docIndex = 0;
    roomsSnapshot.forEach((doc) => {
      docIndex++;
      console.log(`🔍 FIRESTORE QUERY: Processing document ${docIndex}/${roomsSnapshot.size}`);
      console.log(`🔍 FIRESTORE QUERY: Document ID: ${doc.id}`);
      console.log(`🔍 FIRESTORE QUERY: Document exists: ${doc.exists()}`);
      console.log(`🔍 FIRESTORE QUERY: Document ref:`, doc.ref);
      console.log(`🔍 FIRESTORE QUERY: Document metadata:`, doc.metadata);
      
      const data = doc.data();
      console.log(`🔍 FIRESTORE QUERY: Document data for ${doc.id}:`, data);
      console.log(`🔍 FIRESTORE QUERY: Data keys:`, Object.keys(data || {}));
      console.log(`🔍 FIRESTORE QUERY: Data types:`, Object.entries(data || {}).map(([key, value]) => [key, typeof value]));
      
      const room = { 
        id: doc.id, 
        ...data,
        availability: data.availability !== false,
        bookings: data.bookings || []
      } as Room;
      
      console.log(`🔍 FIRESTORE QUERY: Processed room ${doc.id}:`, {
        id: room.id,
        name: room.name,
        price: room.price,
        capacity: room.capacity,
        availability: room.availability,
        bookingsCount: room.bookings?.length || 0
      });
      rooms.push(room);
    });
    
    console.log("🔍 FIRESTORE QUERY: ================== PROCESSING COMPLETE ==================");
    console.log("🔍 FIRESTORE QUERY: ✅ Successfully fetched rooms from Firestore:", rooms.length);
    console.log("🔍 FIRESTORE QUERY: Final rooms array:", rooms.map(r => ({ id: r.id, name: r.name, price: r.price })));
    console.log("🔍 FIRESTORE QUERY: ================== RETURNING ROOMS ==================");
    return rooms;
  } catch (error) {
    console.error("🔍 FIRESTORE QUERY: ❌ ================== FIRESTORE ERROR ==================");
    console.error("🔍 FIRESTORE QUERY: Failed to fetch rooms");
    console.error("🔍 FIRESTORE QUERY: Error type:", typeof error);
    console.error("🔍 FIRESTORE QUERY: Error constructor:", error?.constructor?.name);
    console.error("🔍 FIRESTORE QUERY: Error message:", (error as any)?.message);
    console.error("🔍 FIRESTORE QUERY: Error code:", (error as any)?.code);
    console.error("🔍 FIRESTORE QUERY: Error details:", (error as any)?.details);
    console.error("🔍 FIRESTORE QUERY: Full error object:", error);
    console.error("🔍 FIRESTORE QUERY: Error stack:", (error as any)?.stack);
    
    // Additional Firebase-specific error analysis
    if ((error as any)?.code) {
      console.error("🔍 FIRESTORE QUERY: Firebase error code analysis:");
      const errorCode = (error as any).code;
      switch (errorCode) {
        case 'permission-denied':
          console.error("🔍 FIRESTORE QUERY:   - PERMISSION DENIED: Check your Firestore security rules");
          break;
        case 'unavailable':
          console.error("🔍 FIRESTORE QUERY:   - SERVICE UNAVAILABLE: Firestore service is down");
          break;
        case 'unauthenticated':
          console.error("🔍 FIRESTORE QUERY:   - UNAUTHENTICATED: User needs to be logged in");
          break;
        case 'not-found':
          console.error("🔍 FIRESTORE QUERY:   - NOT FOUND: Collection or document doesn't exist");
          break;
        default:
          console.error("🔍 FIRESTORE QUERY:   - UNKNOWN ERROR CODE:", errorCode);
      }
    }
    
    console.error("🔍 FIRESTORE QUERY: ================== THROWING ERROR ==================");
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
