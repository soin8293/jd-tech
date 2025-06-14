
import { doc, setDoc, deleteDoc, updateDoc, arrayUnion, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, BookingPeriod } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const saveRoom = async (room: Room, expectedVersion?: number): Promise<void> => {
  try {
    if (!room.id) {
      throw new Error("Room ID is required");
    }
    
    const roomRef = doc(db, ROOMS_COLLECTION, room.id);
    
    // Use transaction for optimistic concurrency control
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (roomDoc.exists() && expectedVersion !== undefined) {
        const currentVersion = roomDoc.data().version || 0;
        if (expectedVersion !== currentVersion) {
          throw new Error("This room has been updated by someone else. Please refresh and try again.");
        }
      }
      
      const newVersion = roomDoc.exists() ? (roomDoc.data().version || 0) + 1 : 1;
      
      transaction.set(roomRef, {
        name: room.name,
        description: room.description,
        price: room.price,
        capacity: room.capacity,
        size: room.size,
        bed: room.bed,
        amenities: room.amenities,
        images: room.images,
        availability: room.availability,
        bookings: room.bookings || [],
        version: newVersion,
        updatedAt: serverTimestamp(),
        updatedBy: room.updatedBy,
        updatedByEmail: room.updatedByEmail
      });
    });
    
    console.log(`Room ${room.id} saved successfully with version control`);
  } catch (error) {
    console.error("Error saving room:", error);
    throw error;
  }
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
    console.log(`Room ${roomId} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting room ${roomId}:`, error);
    throw error;
  }
};

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
