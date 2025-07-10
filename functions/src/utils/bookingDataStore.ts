
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { v4 as uuidv4 } from 'uuid';

export const storeBookingData = async (
  bookingId: string,
  paymentIntent: any,
  bookingData: any,
  transaction?: admin.firestore.Transaction
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
    
    // Extract and convert dates properly
    const checkInStr = bookingData.bookingDetails?.period?.checkIn;
    const checkOutStr = bookingData.bookingDetails?.period?.checkOut;
    
    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;
    
    if (checkInStr) {
      checkInDate = new Date(checkInStr);
    }
    if (checkOutStr) {
      checkOutDate = new Date(checkOutStr);
    }
    
    const numberOfNights = checkInDate && checkOutDate ? 
      Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)) : 
      0;
    
    const guests = bookingData.bookingDetails?.guests || 1;
    const userId = bookingData.userId || 'guest';
    const userEmail = bookingData.userEmail || null;
    
    // Create the period object with Firebase Timestamps
    const period = {
      startDate: checkInDate ? admin.firestore.Timestamp.fromDate(checkInDate) : null,
      endDate: checkOutDate ? admin.firestore.Timestamp.fromDate(checkOutDate) : null
    };
    
    // Structure the booking record
    const bookingRecord = {
      id: bookingId,
      paymentIntentId: paymentIntent.id,
      paymentMethodId: bookingData.paymentMethodId,
      paymentType: bookingData.paymentType,
      transaction_id: bookingData.transaction_id,
      // Store the period in the format expected by the frontend
      period,
      // Also store top-level dates for easier querying
      checkIn: checkInDate,
      checkOut: checkOutDate,
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
    const executeTransaction = async (txn: admin.firestore.Transaction) => {
      // 1. Store the booking
      const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
      txn.set(bookingRef, bookingRecord);
      
      // 2. Update each room's availability
      if (bookingData.bookingDetails?.rooms && bookingData.bookingDetails.rooms.length > 0 && checkInDate && checkOutDate) {
        const bookingPeriod = {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          bookingReference: bookingId,
          guestEmail: userEmail,
          status: 'confirmed'
        };
        
        for (const room of bookingData.bookingDetails.rooms) {
          if (room.id) {
            const roomRef = admin.firestore().collection('rooms').doc(room.id);
            console.log(`Updating room ${room.id} with booking period:`, bookingPeriod);
            
            // Add booking to the room's bookings array
            txn.update(roomRef, {
              bookings: admin.firestore.FieldValue.arrayUnion(bookingPeriod),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastBookedBy: userEmail || 'guest'
            });
          }
        }
      }
      
      // 3. If user has an account, update their profile with the booking reference
      if (userId !== 'guest') {
        const userRef = admin.firestore().collection('users').doc(userId);
        const userDoc = await txn.get(userRef);
        
        if (userDoc.exists) {
          txn.update(userRef, {
            bookings: admin.firestore.FieldValue.arrayUnion(bookingId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Create a new user profile if none exists
          txn.set(userRef, {
            email: userEmail,
            bookings: [bookingId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    };

    // Use provided transaction or create a new one
    if (transaction) {
      await executeTransaction(transaction);
    } else {
      await admin.firestore().runTransaction(executeTransaction);
    }
    
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
