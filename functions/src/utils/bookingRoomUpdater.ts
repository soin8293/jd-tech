
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const updateRoomsAfterBooking = async (bookingId: string, bookingDetails: any) => {
  const roomUpdates = bookingDetails.rooms.map(async (roomData: any) => {
    if (!roomData.id) return Promise.resolve();
    
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
    
    // Add booking to the room's bookings array
    return roomRef.update({
      bookings: admin.firestore.FieldValue.arrayUnion(bookingPeriod)
    });
  });
  
  await Promise.all(roomUpdates);
  console.log(`Room availability updated for ${bookingDetails.rooms.length} rooms`);
};
