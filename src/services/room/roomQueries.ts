
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const getRooms = async (): Promise<Room[]> => {
  // Check if Firebase is properly initialized
  if (!db) {
    console.warn("⚠️ Firebase not configured - using fallback data");
    throw new Error("Firebase not configured");
  }
  
  try {
    const roomsCollection = collection(db, ROOMS_COLLECTION);
    const roomsSnapshot = await getDocs(roomsCollection);
    if (roomsSnapshot.empty) {
      console.warn("⚠️ No rooms found in Firestore collection");
      return [];
    }
    
    const rooms: Room[] = [];
    roomsSnapshot.forEach((doc) => {
      const data = doc.data();
      const room = { 
        id: doc.id, 
        ...data,
        availability: data.availability !== false,
        bookings: data.bookings || []
      } as Room;
      rooms.push(room);
    });
    
    return rooms;
  } catch (error) {
    console.error("❌ Failed to fetch rooms from Firestore:", error);
    throw error;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  if (!db) {
    console.warn("⚠️ Firebase not configured - cannot fetch room");
    throw new Error("Firebase not configured");
  }

  try {
    const roomDocRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomDoc = await getDoc(roomDocRef);
    
    if (!roomDoc.exists()) {
      console.warn(`⚠️ Room document ${roomId} does not exist`);
      return null;
    }
    
    const data = roomDoc.data();
    const room = { 
      id: roomDoc.id, 
      ...data,
      availability: data.availability !== false,
      bookings: data.bookings || []
    } as Room;
    
    return room;
  } catch (error) {
    console.error(`❌ Failed to fetch room ${roomId}:`, error);
    throw error;
  }
};
