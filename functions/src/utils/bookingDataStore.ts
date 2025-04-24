
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { v4 as uuidv4 } from 'uuid';

export const storeBookingData = async (
  bookingId: string,
  paymentIntent: any,
  bookingData: any
) => {
  try {
    console.log(`Storing booking data for ID: ${bookingId}`, {
      paymentIntentId: paymentIntent.id,
      transaction_id: bookingData.transaction_id,
      amount: paymentIntent.amount / 100,
      userEmail: bookingData.userEmail || 'not provided',
      paymentType: bookingData.paymentType
    });
    
    // Log the booking details for debugging
    console.log(`Booking details for ID: ${bookingId}`, JSON.stringify({
      rooms: bookingData.bookingDetails?.rooms?.length || 0,
      checkIn: bookingData.bookingDetails?.period?.checkIn,
      checkOut: bookingData.bookingDetails?.period?.checkOut,
      guests: bookingData.bookingDetails?.guests
    }, null, 2));
    
    // Create a secure booking token for anonymous users
    const bookingToken = uuidv4();
    
    // Extract important data from nested bookingDetails to top level
    const checkIn = bookingData.bookingDetails?.period?.checkIn;
    const checkOut = bookingData.bookingDetails?.period?.checkOut;
    const numberOfNights = bookingData.bookingDetails?.numberOfNights ||
      (checkIn && checkOut ? 
        Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24)) : 
        0);
    const guests = bookingData.bookingDetails?.guests || 1;
    const userId = bookingData.userId || bookingData.bookingDetails?.userId || 'guest';
    const userEmail = bookingData.userEmail || bookingData.bookingDetails?.userEmail || null;
    
    // Structure the booking record
    const bookingRecord = {
      id: bookingId,
      paymentIntentId: paymentIntent.id,
      paymentMethodId: bookingData.paymentMethodId,
      paymentType: bookingData.paymentType,
      transaction_id: bookingData.transaction_id,
      bookingDetails: bookingData.bookingDetails,
      // Top-level fields for easier querying
      checkIn,
      checkOut,
      numberOfNights,
      guests,
      rooms: bookingData.bookingDetails?.rooms || [],
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      userEmail,
      bookingToken
    };
    
    // Run all operations in a transaction for data consistency
    await admin.firestore().runTransaction(async (transaction) => {
      // 1. Store the booking
      const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
      transaction.set(bookingRef, bookingRecord);
      
      // 2. Update each room's availability
      if (bookingData.bookingDetails?.rooms && bookingData.bookingDetails.rooms.length > 0) {
        const bookingPeriod = {
          checkIn: bookingData.bookingDetails.period.checkIn,
          checkOut: bookingData.bookingDetails.period.checkOut
        };
        
        bookingData.bookingDetails.rooms.forEach((room: any) => {
          if (room.id) {
            const roomRef = admin.firestore().collection('rooms').doc(room.id);
            transaction.update(roomRef, {
              bookings: admin.firestore.FieldValue.arrayUnion(bookingPeriod)
            });
          }
        });
      }
      
      // 3. If user has an account, update their profile with the booking reference
      if (userId !== 'guest') {
        const userRef = admin.firestore().collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);
        
        if (userDoc.exists) {
          transaction.update(userRef, {
            bookings: admin.firestore.FieldValue.arrayUnion(bookingId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Create a new user profile if none exists
          transaction.set(userRef, {
            email: userEmail,
            bookings: [bookingId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });
    
    console.log(`Booking stored in Firestore with ID: ${bookingId}`);
    
    return {
      ...bookingRecord,
      bookingToken // Include the token in the response for sharing with the client
    };
  } catch (firestoreError: any) {
    console.error("Error storing booking in Firestore:", {
      error: firestoreError,
      message: firestoreError.message,
      code: firestoreError.code,
      details: firestoreError,
      bookingId: bookingId
    });
    
    // Log full error object for debugging
    console.error("Full Firestore error:", JSON.stringify(firestoreError, null, 2));
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to store booking data',
      {
        type: 'booking_storage_error',
        details: {
          message: firestoreError.message,
          code: firestoreError.code || 'unknown'
        }
      }
    );
  }
};
