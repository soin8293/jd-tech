import * as admin from "firebase-admin";
import { createPaymentIntent } from "./payment/createPaymentIntent";
import { processBooking } from "./payment/processBooking";
import * as functions from "firebase-functions";

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Grants or revokes admin custom claims for a user based on email.
 * Must be called by an existing admin.
 */
export const manageAdminRole = functions.https.onCall(async (data, context) => {
  // 1. Check if the caller is an admin
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Caller must be an admin to manage roles."
    );
  }
  
  // 2. Validate input data
  const email = data.email;
  const makeAdmin = !!data.makeAdmin; // Ensure boolean
  if (!email || typeof email !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email must be provided and be a string."
    );
  }
  
  try {
    // 3. Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    
    // 4. Set the custom claim
    await admin.auth().setCustomUserClaims(uid, { admin: makeAdmin });
    
    // 5. Update the Firestore list for reference
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    try {
      if (makeAdmin) {
        await adminConfigRef.update({
          adminEmails: admin.firestore.FieldValue.arrayUnion(email)
        });
      } else {
        await adminConfigRef.update({
          adminEmails: admin.firestore.FieldValue.arrayRemove(email)
        });
      }
    } catch (firestoreError: unknown) {
      console.error("Failed to update adminEmails list in Firestore:", firestoreError);
      // Try to create the document if it doesn't exist
      try {
        await adminConfigRef.set({
          adminEmails: makeAdmin ? [email] : []
        });
      } catch (setError: unknown) {
        console.error("Failed to create admin config document:", setError);
      }
    }
    
    return {
      success: true,
      message: `Successfully ${makeAdmin ? 'granted' : 'revoked'} admin role for ${email}.`,
    };
  } catch (error: unknown) {
    console.error("Error managing admin role:", error);
    if (error instanceof Error && 'code' in error && error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError("not-found", `User with email ${email} not found.`);
    }
    // Handle other potential errors
    throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
  }
});

/**
 * Set initial admin user.
 * This function should be called once to set up the first admin.
 */
export const setInitialAdmin = functions.https.onCall(async (data, context) => {
  const targetEmail = "amirahcolorado@gmail.com";
  
  try {
    // Find the user by email
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    
    // Set admin claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Create or update the admin config document
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    await adminConfigRef.set({
      adminEmails: [targetEmail]
    }, { merge: true });
    
    return {
      success: true,
      message: `Successfully set ${targetEmail} as the initial admin.`
    };
  } catch (error: unknown) {
    console.error("Error setting initial admin:", error);
    throw new functions.https.HttpsError("internal", "Failed to set initial admin user.");
  }
});

/**
 * Scheduled function that runs every hour to check for rooms that should be made available
 * after their checkout time has passed (11:00 AM Nigerian time)
 */
export const updateRoomAvailability = functions.pubsub
  .schedule('every 60 minutes')
  .timeZone('Africa/Lagos') // Nigerian timezone
  .onRun(async (context) => {
    try {
      console.log('Running scheduled room availability update');
      
      // Get current time in Nigerian timezone
      const now = new Date();
      
      // Check if it's past 11:00 AM Nigerian time (function runs in the specified timezone)
      if (now.getHours() < 11) {
        console.log('It is before 11:00 AM Nigerian time, skipping room availability update');
        return null;
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
        return null;
      }
      
      // Process each booking to update room availability
      const roomUpdatesPromises = [];
      
      bookingsSnapshot.forEach(doc => {
        const booking = doc.data();
        const rooms = booking.bookingDetails.rooms || [];
        
        // For each room in the booking
        rooms.forEach(room => {
          if (!room.id) return;
          
          // Get the room document
          const roomRef = admin.firestore().collection('rooms').doc(room.id);
          
          // Create a promise for this room update
          const roomUpdatePromise = roomRef.get().then(roomDoc => {
            if (!roomDoc.exists) {
              console.log(`Room ${room.id} not found, skipping`);
              return;
            }
            
            const roomData = roomDoc.data();
            const bookings = roomData?.bookings || [];
            
            // Find bookings that are not today's checkout (we keep future bookings)
            const updatedBookings = bookings.filter(b => {
              // Convert to YYYY-MM-DD format for comparison
              const checkoutDate = new Date(b.checkOut).toISOString().split('T')[0];
              return checkoutDate !== today;
            });
            
            console.log(`Updating room ${room.id} - removing today's checkout bookings`);
            
            // Update the room with filtered bookings
            return roomRef.update({
              bookings: updatedBookings
            });
          });
          
          roomUpdatesPromises.push(roomUpdatePromise);
        });
      });
      
      await Promise.all(roomUpdatesPromises);
      console.log('Room availability updates completed successfully');
      return null;
    } catch (error) {
      console.error('Error updating room availability:', error);
      return null;
    }
  });

// Export all the functions
export {
  createPaymentIntent,
  processBooking
};
