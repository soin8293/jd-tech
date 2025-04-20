
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const updateRoomsAfterBooking = async (bookingId: string, bookingDetails: any) => {
  try {
    console.log(`Updating room availability for booking: ${bookingId}`, {
      numberOfRooms: bookingDetails.rooms.length,
      period: bookingDetails.period
    });
    
    const roomUpdates = bookingDetails.rooms.map(async (roomData: any) => {
      if (!roomData.id) {
        console.log(`Room ID missing in booking data, skipping update`);
        return Promise.resolve();
      }
      
      const roomRef = admin.firestore().collection('rooms').doc(roomData.id);
      const roomDoc = await roomRef.get();
      
      if (!roomDoc.exists) {
        console.log(`Room ${roomData.id} not found, skipping availability update`);
        return Promise.resolve();
      }
      
      const bookingPeriod = {
        checkIn: bookingDetails.period.checkIn,
        checkOut: bookingDetails.period.checkOut
      };
      
      console.log(`Updating availability for room: ${roomData.id}`, {
        checkIn: bookingPeriod.checkIn,
        checkOut: bookingPeriod.checkOut
      });
      
      // Add booking to the room's bookings array
      return roomRef.update({
        bookings: admin.firestore.FieldValue.arrayUnion(bookingPeriod)
      });
    });
    
    await Promise.all(roomUpdates);
    console.log(`Room availability updated for ${bookingDetails.rooms.length} rooms`);
  } catch (error: any) {
    console.error("Error updating room availability:", {
      error: error,
      message: error.message,
      bookingId: bookingId
    });
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update room availability',
      {
        type: 'room_update_error',
        details: {
          message: error.message,
          code: error.code || 'unknown'
        }
      }
    );
  }
};
