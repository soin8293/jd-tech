
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { stripe } from "../config/stripe";

// Interface definitions for type safety
interface BookingDetails {
  rooms: {
    id?: string;
    price: number;
    name?: string;
  }[];
  period: {
    checkIn: string;
    checkOut: string;
  };
  guests: number;
  totalPrice: number;
  currency?: string;
}

interface ProcessBookingData {
  paymentMethodId: string;
  clientSecret: string;
  paymentType: string;
  transaction_id: string;
  paymentIntentId: string;
  bookingDetails: BookingDetails;
  serverCalculatedAmount?: number;
}

interface PaymentResponse {
  success: boolean;
  partial?: boolean;
  bookingId?: string;
  paymentStatus?: string;
  message?: string;
  error?: {
    type: string;
    message: string;
  };
}

/**
 * Firebase Cloud Function to process a booking after payment.
 * Verifies payment status with Stripe before confirming the booking.
 */
export const processBooking = functions.https.onCall(async (data: ProcessBookingData, context: functions.https.CallableContext): Promise<PaymentResponse> => {
  try {
    console.log("Processing booking with data:", JSON.stringify(data, null, 2));
    
    // 1. Extract the payment details from request
    const { paymentMethodId, clientSecret, paymentType, transaction_id, paymentIntentId, bookingDetails } = data;
    
    if (!paymentIntentId) {
      console.error("Missing paymentIntentId in processBooking request");
      throw new functions.https.HttpsError(
        "invalid-argument", 
        "Payment Intent ID is required to verify payment status",
        { type: 'validation_error' }
      );
    }
    
    // 2. Verify the payment status with Stripe
    console.log(`Verifying payment status for Payment Intent: ${paymentIntentId}`);
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError: unknown) {
      console.error("Error retrieving payment intent from Stripe:", stripeError);
      let errorMessage = "Could not verify payment status with Stripe. Please try again later.";
      if (stripeError instanceof Error) {
        errorMessage = stripeError.message;
      }
      throw new functions.https.HttpsError(
        "unavailable",
        errorMessage,
        { type: 'network_error' }
      );
    }
    
    // 3. Check if payment is successful
    if (paymentIntent.status !== 'succeeded') {
      console.error(`Payment verification failed. Status: ${paymentIntent.status}`);
      throw new functions.https.HttpsError(
        "failed-precondition", 
        `Payment not completed successfully. Current status: ${paymentIntent.status}`,
        { type: 'payment_failed' }
      );
    }
    
    console.log(`Payment verified successfully. Status: ${paymentIntent.status}`);
    
    // 4. Generate a booking ID
    const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 5. Store booking in Firestore
    try {
      const bookingData = {
        id: bookingId,
        paymentIntentId: paymentIntentId,
        paymentMethodId: paymentMethodId,
        paymentType: paymentType,
        transaction_id: transaction_id,
        bookingDetails: bookingDetails,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: 'confirmed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: context.auth?.uid || 'guest' // Use authenticated user ID if available
      };
      
      await admin.firestore().collection('bookings').doc(bookingId).set(bookingData);
      console.log(`Booking stored in Firestore with ID: ${bookingId}`);
    } catch (firestoreError: unknown) {
      console.error("Error storing booking in Firestore:", firestoreError);
      let errorMessage = "Failed to store booking details.";
      if (firestoreError instanceof Error) {
        errorMessage = firestoreError.message;
      }
      
      // Payment was successful, but we couldn't store the booking
      // This is a partial success case - we should let the user know
      return {
        success: true,
        partial: true,
        bookingId: bookingId,
        paymentStatus: paymentIntent.status,
        message: "Payment successful, but booking details could not be saved. Please contact support with your transaction ID."
      };
    }
    
    // 6. Return success response with booking ID
    console.log(`Booking processed successfully. Booking ID: ${bookingId}`);
    
    return {
      success: true,
      bookingId: bookingId,
      paymentStatus: paymentIntent.status,
      message: "Booking confirmed successfully!"
    };
    
  } catch (error: unknown) {
    console.error("Error processing booking:", error);
    
    // Enhanced error categorization for better client-side handling
    let errorType = 'unknown';
    let errorMessage = 'Failed to process booking. Please try again.';
    
    // If the error is from our HttpsError, use its type
    if (typeof error === 'object' && error !== null) {
      if ('code' in error && typeof error.code === 'string' && error.code.startsWith('functions/')) {
        if ('details' in error && error.details && typeof error.details === 'object' && 'type' in error.details) {
          errorType = error.details.type as string;
        } else {
          // Map HttpsError codes to our error types
          const codeToType: Record<string, string> = {
            'functions/invalid-argument': 'validation_error',
            'functions/failed-precondition': 'payment_failed',
            'functions/unavailable': 'network_error',
            'functions/internal': 'system_error'
          };
          errorType = error.code in codeToType ? codeToType[error.code] : 'booking_failed';
        }
        
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      } else if ('type' in error && typeof error.type === 'string') {
        // If it's a Stripe error, map its type
        if (error.type.toString().startsWith('Stripe')) {
          errorType = 'payment_failed';
          if ('message' in error && typeof error.message === 'string') {
            errorMessage = `Payment processing error: ${error.message}`;
          }
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage
      }
    };
  }
});
