
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";
import { seedRooms } from "./roomSeed";
import { hotelRooms } from "@/data/hotel.data";

const ROOMS_COLLECTION = "rooms";

export const getRooms = async (): Promise<Room[]> => {
  try {
    const roomsSnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
    
    if (roomsSnapshot.empty) {
      console.log("No rooms found in Firestore, seeding with default data");
      await seedRooms();
      return hotelRooms;
    }
    
    const rooms: Room[] = [];
    roomsSnapshot.forEach((doc) => {
      const data = doc.data();
      rooms.push({ 
        id: doc.id, 
        ...data,
        // Ensure rooms are available by default if not specified
        availability: data.availability !== false,
        // Initialize empty bookings array if none exists
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
    
    return { id: roomDoc.id, ...roomDoc.data() } as Room;
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    throw error;
  }
};
