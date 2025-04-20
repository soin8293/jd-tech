
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, BookingPeriod } from "@/types/hotel.types";
import { hotelRooms } from "@/data/hotel.data";
import { toNigerianTime, getCheckoutTimeOnDate } from "@/utils/availabilityUtils";

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
      availability: room.availability,
      bookings: room.bookings || []
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
 * Add a booking to a room
 */
export const addBookingToRoom = async (roomId: string, bookingPeriod: BookingPeriod): Promise<void> => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      bookings: arrayUnion({
        checkIn: bookingPeriod.checkIn,
        checkOut: bookingPeriod.checkOut
      })
    });
    console.log(`Booking added to room ${roomId}`);
  } catch (error) {
    console.error(`Error adding booking to room ${roomId}:`, error);
    throw error;
  }
};

/**
 * Get available rooms for a specified period
 */
export const getAvailableRooms = async (checkIn: Date, checkOut: Date): Promise<Room[]> => {
  try {
    const allRooms = await getRooms();
    const now = new Date();
    
    // Filter out rooms that are booked for the requested period
    return allRooms.filter(room => {
      // Skip rooms that are marked unavailable
      if (!room.availability) return false;
      
      // If room has no bookings, it's available
      if (!room.bookings || room.bookings.length === 0) return true;
      
      // Check each booking for overlap
      return !room.bookings.some(booking => {
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        
        // Special case: If today is checkout day and it's past 11 AM Nigerian time
        if (isSameDay(bookingCheckOut, now)) {
          const currentNigerianTime = toNigerianTime(now);
          const checkoutTimeToday = getCheckoutTimeOnDate(currentNigerianTime);
          
          if (currentNigerianTime >= checkoutTimeToday) {
            // After 11 AM Nigerian time, the room becomes available
            return false;
          }
        }
        
        // Check for date overlap
        return (
          (checkIn >= bookingCheckIn && checkIn < bookingCheckOut) ||
          (checkOut > bookingCheckIn && checkOut <= bookingCheckOut) ||
          (checkIn <= bookingCheckIn && checkOut >= bookingCheckOut)
        );
      });
    });
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    throw error;
  }
};

/**
 * Helper function to check if two dates are the same day
 */
const isSameDay = (date1: Date, date2: Date): boolean => {
  date1 = new Date(date1);
  date2 = new Date(date2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
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
