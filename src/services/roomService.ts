
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";
import { hotelRooms } from "@/data/hotel.data";

// Collection reference
const ROOMS_COLLECTION = "rooms";

/**
 * Get all rooms from Firestore
 */
export const getRooms = async (): Promise<Room[]> => {
  try {
    const roomsSnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
    
    // If no rooms exist in Firestore yet, seed with default data
    if (roomsSnapshot.empty) {
      console.log("No rooms found in Firestore, seeding with default data");
      await seedRooms();
      return hotelRooms;
    }
    
    const rooms: Room[] = [];
    roomsSnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() } as Room);
    });
    
    console.log("Fetched rooms from Firestore:", rooms);
    return rooms;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

/**
 * Get a single room by ID
 */
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

/**
 * Save room data to Firestore (create or update)
 */
export const saveRoom = async (room: Room): Promise<void> => {
  try {
    // Make sure the room has an ID
    if (!room.id) {
      throw new Error("Room ID is required");
    }
    
    const roomRef = doc(db, ROOMS_COLLECTION, room.id);
    await setDoc(roomRef, {
      name: room.name,
      description: room.description,
      price: room.price,
      capacity: room.capacity,
      size: room.size,
      bed: room.bed,
      amenities: room.amenities,
      images: room.images,
      availability: room.availability
    });
    
    console.log(`Room ${room.id} saved successfully`);
  } catch (error) {
    console.error("Error saving room:", error);
    throw error;
  }
};

/**
 * Delete a room from Firestore
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
    console.log(`Room ${roomId} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting room ${roomId}:`, error);
    throw error;
  }
};

/**
 * Save multiple rooms (used for bulk updates)
 */
export const saveRooms = async (rooms: Room[]): Promise<void> => {
  try {
    const savePromises = rooms.map(room => saveRoom(room));
    await Promise.all(savePromises);
    console.log(`${rooms.length} rooms saved successfully`);
  } catch (error) {
    console.error("Error saving rooms:", error);
    throw error;
  }
};

/**
 * Seed the Firestore database with initial room data
 * This is called if no rooms exist in the database
 */
export const seedRooms = async (): Promise<void> => {
  try {
    const savePromises = hotelRooms.map(room => saveRoom(room));
    await Promise.all(savePromises);
    console.log("Database seeded with initial room data");
  } catch (error) {
    console.error("Error seeding rooms:", error);
    throw error;
  }
};
