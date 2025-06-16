
import { doc, setDoc, deleteDoc, updateDoc, arrayUnion, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Room, BookingPeriod } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const saveRoom = async (room: Room, expectedVersion?: number): Promise<void> => {
  try {
    console.log('🏠 ROOM MUTATION: ================== STARTING SAVE ROOM ==================');
    console.log('🏠 ROOM MUTATION: Room ID:', room.id);
    console.log('🏠 ROOM MUTATION: Room name:', room.name);
    console.log('🏠 ROOM MUTATION: Expected version:', expectedVersion);
    
    // Check current auth state
    const currentUser = auth.currentUser;
    console.log('🏠 ROOM MUTATION: Current user:', {
      uid: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified
    });
    
    if (!currentUser) {
      throw new Error("User must be authenticated to save rooms");
    }
    
    // Get fresh ID token to ensure admin claims are current
    console.log('🏠 ROOM MUTATION: Getting fresh ID token...');
    const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh
    console.log('🏠 ROOM MUTATION: Fresh ID token claims:', {
      admin: idTokenResult.claims.admin,
      email: idTokenResult.claims.email,
      allClaims: idTokenResult.claims
    });
    
    if (!room.id) {
      throw new Error("Room ID is required");
    }
    
    const roomRef = doc(db, ROOMS_COLLECTION, room.id);
    console.log('🏠 ROOM MUTATION: Room reference created:', roomRef.path);
    
    // Use transaction for optimistic concurrency control
    await runTransaction(db, async (transaction) => {
      console.log('🏠 ROOM MUTATION: Starting transaction...');
      const roomDoc = await transaction.get(roomRef);
      console.log('🏠 ROOM MUTATION: Current room doc exists:', roomDoc.exists());
      
      if (roomDoc.exists() && expectedVersion !== undefined) {
        const currentVersion = roomDoc.data().version || 0;
        console.log('🏠 ROOM MUTATION: Version check:', { currentVersion, expectedVersion });
        if (expectedVersion !== currentVersion) {
          throw new Error("This room has been updated by someone else. Please refresh and try again.");
        }
      }
      
      const newVersion = roomDoc.exists() ? (roomDoc.data().version || 0) + 1 : 1;
      console.log('🏠 ROOM MUTATION: New version will be:', newVersion);
      
      const roomData = {
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
        updatedBy: currentUser.uid,
        updatedByEmail: currentUser.email
      };
      
      console.log('🏠 ROOM MUTATION: Room data to save:', {
        ...roomData,
        updatedAt: 'serverTimestamp()',
        bookingsCount: roomData.bookings.length
      });
      
      transaction.set(roomRef, roomData);
      console.log('🏠 ROOM MUTATION: Transaction.set() called');
    });
    
    console.log(`🏠 ROOM MUTATION: ✅ Room ${room.id} saved successfully with version control`);
  } catch (error) {
    console.error("🏠 ROOM MUTATION: ❌ Error saving room:", error);
    console.error("🏠 ROOM MUTATION: Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  try {
    console.log('🏠 ROOM MUTATION: ================== STARTING DELETE ROOM ==================');
    console.log('🏠 ROOM MUTATION: Room ID to delete:', roomId);
    
    // Check current auth state
    const currentUser = auth.currentUser;
    console.log('🏠 ROOM MUTATION: Current user for delete:', {
      uid: currentUser?.uid,
      email: currentUser?.email
    });
    
    if (!currentUser) {
      throw new Error("User must be authenticated to delete rooms");
    }
    
    // Get fresh ID token
    const idTokenResult = await currentUser.getIdTokenResult(true);
    console.log('🏠 ROOM MUTATION: Delete operation - admin claims:', idTokenResult.claims.admin);
    
    await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
    console.log(`🏠 ROOM MUTATION: ✅ Room ${roomId} deleted successfully`);
  } catch (error) {
    console.error(`🏠 ROOM MUTATION: ❌ Error deleting room ${roomId}:`, error);
    throw error;
  }
};

export const saveRooms = async (rooms: Room[]): Promise<void> => {
  try {
    console.log('🏠 ROOM MUTATION: ================== STARTING BULK SAVE ROOMS ==================');
    console.log('🏠 ROOM MUTATION: Number of rooms to save:', rooms.length);
    console.log('🏠 ROOM MUTATION: Room IDs:', rooms.map(r => r.id));
    
    const savePromises = rooms.map(room => saveRoom(room));
    await Promise.all(savePromises);
    console.log(`🏠 ROOM MUTATION: ✅ ${rooms.length} rooms saved successfully`);
  } catch (error) {
    console.error("🏠 ROOM MUTATION: ❌ Error saving rooms:", error);
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
    console.log(`🏠 ROOM MUTATION: ✅ Booking added to room ${roomId}`);
  } catch (error) {
    console.error(`🏠 ROOM MUTATION: ❌ Error adding booking to room ${roomId}:`, error);
    throw error;
  }
};
