
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

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
    
    const bookingRecord = {
      id: bookingId,
      paymentIntentId: paymentIntent.id,
      paymentMethodId: bookingData.paymentMethodId,
      paymentType: bookingData.paymentType,
      transaction_id: bookingData.transaction_id,
      bookingDetails: bookingData.bookingDetails,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: bookingData.bookingDetails.userId || 'guest',
      userEmail: bookingData.bookingDetails.userEmail || null
    };
    
    await admin.firestore().collection('bookings').doc(bookingId).set(bookingRecord);
    console.log(`Booking stored in Firestore with ID: ${bookingId}`);
    
    return bookingRecord;
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
