
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";
import { seedRooms } from "./roomSeed";
import { hotelRooms } from "@/data/hotel.data";

const ROOMS_COLLECTION = "rooms";

export const getRooms = async (): Promise<Room[]> => {
  try {
    console.log("Fetching rooms from Firestore...");
    const roomsSnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
    
    if (roomsSnapshot.empty) {
      console.log("No rooms found in Firestore, seeding with default data");
      try {
        // Try to seed the database with default rooms
        await seedRooms();
        console.log("Rooms seeded successfully");
        
        // After seeding, attempt to fetch the rooms again
        const seededSnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
        
        if (!seededSnapshot.empty) {
          const rooms: Room[] = [];
          seededSnapshot.forEach((doc) => {
            const data = doc.data();
            rooms.push({ 
              id: doc.id, 
              ...data,
              availability: data.availability !== false,
              bookings: data.bookings || []
            } as Room);
          });
          console.log("Fetched seeded rooms:", rooms);
          return rooms;
        }
      } catch (error) {
        console.error("Error seeding rooms:", error);
      }
      
      // If seeding fails or refetching fails, return default rooms
      console.log("Using default hotel rooms");
      return hotelRooms.map(room => ({
        ...room,
        availability: room.availability !== false,
        bookings: room.bookings || []
      }));
    }
    
    // If rooms were found in Firestore, process them
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
    console.log("Falling back to default rooms");
    
    // In case of any error (including permissions), return the default rooms
    return hotelRooms.map(room => ({
      ...room,
      availability: room.availability !== false,
      bookings: room.bookings || []
    }));
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomDoc = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
    
    if (!roomDoc.exists()) {
      // Look for the room in default data if not found in Firestore
      const defaultRoom = hotelRooms.find(room => room.id === roomId);
      if (defaultRoom) {
        return {
          ...defaultRoom,
          availability: defaultRoom.availability !== false,
          bookings: defaultRoom.bookings || []
        };
      }
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
    // Look for the room in default data if Firestore access fails
    const defaultRoom = hotelRooms.find(room => room.id === roomId);
    if (defaultRoom) {
      return {
        ...defaultRoom,
        availability: defaultRoom.availability !== false,
        bookings: defaultRoom.bookings || []
      };
    }
    throw error;
  }
};
