
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const getRooms = async (): Promise<Room[]> => {
  try {
    console.log("Fetching rooms from Firestore...");
    const roomsSnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
    
    if (roomsSnapshot.empty) {
      console.log("No rooms found in Firestore.");
      return [];
    }
    
    const rooms: Room[] = [];
    roomsSnapshot.forEach((doc) => {
      const data = doc.data();
      rooms.push({ 
        id: doc.id, 
        ...data,
        availability: data.availability !== false,
        bookings: data.bookings || []
      } as Room);
    });
    
    console.log("Fetched rooms from Firestore:", rooms);
    return rooms;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomDoc = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
    
    if (!roomDoc.exists()) {
      return null;
    }
    
    const data = roomDoc.data();
    return { 
      id: roomDoc.id, 
      ...data,
      availability: data.availability !== false,
      bookings: data.bookings || []
    } as Room;
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    throw error;
  }
};
