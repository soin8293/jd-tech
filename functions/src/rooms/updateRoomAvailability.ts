import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { logger } from "../utils/logger";

/**
 * Scheduled function that runs every hour to check for rooms that should be made available
 * after their checkout time has passed (11:00 AM Nigerian time)
 */
export const updateRoomAvailability = onSchedule({
  schedule: 'every 60 minutes',
  timeZone: 'Africa/Lagos' // Nigerian timezone
}, async (event) => {
  try {
    logger.info('Starting scheduled room availability update');
    
    // Initialize Firebase Admin if needed
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    
    // Get current time in Nigerian timezone
    const now = new Date();
    
    // Check if it's past 11:00 AM Nigerian time (function runs in the specified timezone)
    if (now.getHours() < 11) {
      logger.info('Before 11:00 AM Nigerian time, skipping room availability update');
      return;
    }
    
    // Format date as YYYY-MM-DD for comparison
    const today = now.toISOString().split('T')[0];
    
    logger.setContext({ checkoutDate: today });
    logger.info('Searching for bookings with checkout today');
    
    // Get all bookings where checkout date is today
    const bookingsSnapshot = await admin.firestore()
      .collection('bookings')
      .where('bookingDetails.period.checkOut', '>=', `${today}T00:00:00.000Z`)
      .where('bookingDetails.period.checkOut', '<=', `${today}T23:59:59.999Z`)
      .where('status', '==', 'confirmed')
      .get();
    
    logger.info('Found bookings with checkout today', { count: bookingsSnapshot.size });
    
    if (bookingsSnapshot.empty) {
      logger.info('No bookings found with checkout today');
      return;
    }
    
    // Process each booking to update room availability
    const roomUpdatesPromises: Promise<void>[] = [];
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const rooms = booking.bookingDetails?.rooms || [];
      
      logger.debug('Processing booking for room availability update', {
        bookingId: doc.id,
        roomCount: rooms.length
      });
      
      // For each room in the booking
      rooms.forEach((room: { id: string }) => {
        if (!room.id) {
          logger.warn('Room ID missing in booking', { bookingId: doc.id });
          return;
        }
        
        // Get the room document
        const roomRef = admin.firestore().collection('rooms').doc(room.id);
        
        // Create a promise for this room update
        const roomUpdatePromise = roomRef.get().then(async roomDoc => {
          if (!roomDoc.exists) {
            logger.warn('Room not found, skipping', { roomId: room.id });
            return;
          }
          
          const roomData = roomDoc.data();
          const bookings = roomData?.bookings || [];
          
          // Find bookings that are not today's checkout (we keep future bookings)
          const updatedBookings = bookings.filter((b: { checkOut: string | Date }) => {
            try {
              // Convert to YYYY-MM-DD format for comparison
              const checkoutDate = new Date(b.checkOut).toISOString().split('T')[0];
              return checkoutDate !== today;
            } catch (error) {
              logger.error('Error parsing checkout date', { 
                roomId: room.id, 
                checkOut: b.checkOut,
                error 
              });
              return true; // Keep the booking if we can't parse the date
            }
          });
          
          logger.info('Updating room availability', {
            roomId: room.id,
            originalBookings: bookings.length,
            updatedBookings: updatedBookings.length
          });
          
          // Update the room with filtered bookings
          await roomRef.update({
            bookings: updatedBookings,
            lastAvailabilityUpdate: admin.firestore.FieldValue.serverTimestamp()
          });
        }).catch(error => {
          logger.error('Failed to update room availability', {
            roomId: room.id,
            error
          });
        });
        
        roomUpdatesPromises.push(roomUpdatePromise);
      });
    });
    
    await Promise.all(roomUpdatesPromises);
    logger.info('Room availability updates completed successfully', {
      totalUpdates: roomUpdatesPromises.length
    });
    
  } catch (error: any) {
    logger.error('Error in scheduled room availability update', error);
    // Don't throw here - scheduled functions should not fail
  }
});
