
import * as admin from "firebase-admin";

export const storeBookingData = async (
  bookingId: string,
  paymentIntent: any,
  bookingData: any
) => {
  try {
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
      userId: bookingData.bookingDetails.userId || 'guest'
    };
    
    await admin.firestore().collection('bookings').doc(bookingId).set(bookingRecord);
    console.log(`Booking stored in Firestore with ID: ${bookingId}`);
    
    return bookingRecord;
  } catch (firestoreError: any) {
    console.error("Error storing booking in Firestore:", firestoreError);
    throw firestoreError;
  }
};
