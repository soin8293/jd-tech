import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

/**
 * Scheduled function that runs every hour to check for rooms that should be made available
 * after their checkout time has passed (11:00 AM Nigerian time)
 */
export const updateRoomAvailability = onSchedule({
  schedule: 'every 60 minutes',
  timeZone: 'Africa/Lagos' // Nigerian timezone
}, async (event) => {
  try {
    console.log('Running scheduled room availability update');
    
    // Get current time in Nigerian timezone
    const now = new Date();
    
    // Check if it's past 11:00 AM Nigerian time (function runs in the specified timezone)
    if (now.getHours() < 11) {
      console.log('It is before 11:00 AM Nigerian time, skipping room availability update');
      return;
    }
    
    // Format date as YYYY-MM-DD for comparison
    const today = now.toISOString().split('T')[0];
    
    // Get all bookings where checkout date is today
    const bookingsSnapshot = await admin.firestore()
      .collection('bookings')
      .where('bookingDetails.period.checkOut', '>=', `${today}T00:00:00.000Z`)
      .where('bookingDetails.period.checkOut', '<=', `${today}T23:59:59.999Z`)
      .where('status', '==', 'confirmed')
      .get();
    
    console.log(`Found ${bookingsSnapshot.size} bookings with checkout today`);
    
    if (bookingsSnapshot.empty) {
      return;
    }
    
    // Process each booking to update room availability
    const roomUpdatesPromises: Promise<void>[] = [];
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const rooms = booking.bookingDetails.rooms || [];
      
      // For each room in the booking
      rooms.forEach((room: { id: string }) => {
        if (!room.id) return;
        
        // Get the room document
        const roomRef = admin.firestore().collection('rooms').doc(room.id);
        
        // Create a promise for this room update
        const roomUpdatePromise = roomRef.get().then(async roomDoc => {
          if (!roomDoc.exists) {
            console.log(`Room ${room.id} not found, skipping`);
            return;
          }
          
          const roomData = roomDoc.data();
          const bookings = roomData?.bookings || [];
          
          // Find bookings that are not today's checkout (we keep future bookings)
          const updatedBookings = bookings.filter((b: { checkOut: string | Date }) => {
            // Convert to YYYY-MM-DD format for comparison
            const checkoutDate = new Date(b.checkOut).toISOString().split('T')[0];
            return checkoutDate !== today;
          });
          
          console.log(`Updating room ${room.id} - removing today's checkout bookings`);
          
          // Update the room with filtered bookings
          await roomRef.update({
            bookings: updatedBookings
          });
        });
        
        roomUpdatesPromises.push(roomUpdatePromise);
      });
    });
    
    await Promise.all(roomUpdatesPromises);
    console.log('Room availability updates completed successfully');
  } catch (error) {
    console.error('Error updating room availability:', error);
  }
});
