
import * as functions from "firebase-functions";
import { stripe } from "../config/stripe";

// Interface definitions for type safety
interface Room {
  id?: string;
  price: number;
}

interface BookingPeriod {
  checkIn: string;
  checkOut: string;
}

interface CreatePaymentIntentData {
  rooms: Room[];
  period: BookingPeriod;
  guests: number;
  transaction_id?: string;
  booking_reference?: string;
  currency?: string;
}

interface CreatePaymentIntentResponse {
  clientSecret: string | null;
  paymentIntentId: string;
  calculatedAmount: number;
  details: {
    nights: number;
    roomCount: number;
  };
}

/**
 * Firebase Cloud Function to create a Stripe Payment Intent.
 * @param {Object} data - The request data containing booking details.
 * @param {Object} context - The Firebase Functions context.
 * @returns {Object} - Response containing the clientSecret for the Payment Intent.
 */
export const createPaymentIntent = functions.https.onCall(async (data: CreatePaymentIntentData, context: functions.https.CallableContext): Promise<CreatePaymentIntentResponse> => {
  // 1. Authentication Check (Optional but Recommended for Production)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to create a payment intent.");
  // }

  try {
    // 2. Extract booking details from request
    const { rooms, period, guests, transaction_id, booking_reference } = data;
    const currency = data.currency || "usd"; // Default to USD if currency is not provided
    
    console.log(`Payment Intent requested for transaction_id: ${transaction_id}`, { 
      rooms: rooms?.length, 
      period, 
      guests, 
      currency 
    });

    // 3. Input Validation
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      console.error(`Validation error: No rooms provided for booking. Data received:`, data);
      throw new functions.https.HttpsError("invalid-argument", "No rooms provided for booking.");
    }
    
    if (!period || !period.checkIn || !period.checkOut) {
      console.error(`Validation error: Invalid booking period. Period received:`, period);
      throw new functions.https.HttpsError("invalid-argument", "Invalid booking period.");
    }

    // 4. Calculate number of nights
    const checkIn = new Date(period.checkIn);
    const checkOut = new Date(period.checkOut);
    const numberOfNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
    
    console.log(`Booking duration: ${numberOfNights} nights from ${checkIn.toISOString()} to ${checkOut.toISOString()}`);
    
    // 5. Calculate total price from room details and nights
    // In a production environment, you should fetch room prices from your database
    // instead of relying on client-provided prices
    let totalAmount = 0;
    
    // SECURITY ENHANCEMENT: In a production environment, uncomment this code
    // to fetch room prices from Firestore instead of using client-provided prices
    /*
    for (const room of rooms) {
      try {
        const roomDoc = await admin.firestore().collection('rooms').doc(room.id).get();
        if (!roomDoc.exists) {
          throw new functions.https.HttpsError("not-found", `Room ${room.id} not found in database`);
        }
        const roomData = roomDoc.data();
        if (!roomData || typeof roomData.price !== 'number') {
          throw new functions.https.HttpsError("invalid-argument", `Invalid price for room: ${room.id}`);
        }
        totalAmount += roomData.price * numberOfNights;
      } catch (error) {
        console.error(`Error fetching room ${room.id}:`, error);
        throw new functions.https.HttpsError("internal", `Failed to fetch room data: ${error.message}`);
      }
    }
    */
    
    // For now, we're using client-provided prices - replace with the above code in production
    for (const room of rooms) {
      if (!room.price || typeof room.price !== 'number') {
        console.error(`Invalid price for room: ${room.id || 'unknown'}`, room);
        throw new functions.https.HttpsError("invalid-argument", `Invalid price for room: ${room.id || 'unknown'}`);
      }
      
      totalAmount += room.price * numberOfNights;
    }

    // 6. Apply taxes, fees, or discounts if needed
    // const taxRate = 0.08; // 8% tax rate example
    // totalAmount += totalAmount * taxRate;

    // 7. Convert to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);
    
    console.log(`Calculated amount: $${totalAmount} (${amountInCents} cents)`);
    
    if (amountInCents <= 0) {
      console.error(`Invalid amount calculated: ${amountInCents} cents`);
      throw new functions.https.HttpsError("invalid-argument", "Total amount must be greater than zero.");
    }

    // 8. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      metadata: {
        booking_reference: booking_reference || '',
        transaction_id: transaction_id || '',
        nights: numberOfNights,
        rooms: rooms.length,
        guests: guests || 1
      },
      automatic_payment_methods: { enabled: true }, // Enable automatic payment methods for convenience
    });

    console.log(`Payment Intent created successfully: ${paymentIntent.id}`);

    // 9. Return Client Secret to the Frontend
    return { 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id, // Return the ID for verification later
      calculatedAmount: amountInCents / 100, // Send back the calculated amount for validation
      details: {
        nights: numberOfNights,
        roomCount: rooms.length
      }
    };

  } catch (error: unknown) {
    // 10. Enhanced Error Handling
    console.error("Error creating Payment Intent:", error);
    
    if (typeof error === 'object' && error !== null) {
      if ('type' in error) {
        const stripeError = error as { type: string; message: string };
        if (stripeError.type === 'StripeCardError') {
          // Handle specific Stripe card errors (e.g., card declined)
          throw new functions.https.HttpsError('failed-precondition', stripeError.message, { type: 'payment_failed' });
        } else if (stripeError.type === 'StripeAPIError') {
          // Handle Stripe API errors
          throw new functions.https.HttpsError('internal', `Stripe API error: ${stripeError.message}`, { type: 'system_error' });
        } else if (stripeError.type === 'StripeConnectionError') {
          // Handle Stripe connection errors (network issues)
          throw new functions.https.HttpsError('unavailable', `Connection to Stripe failed: ${stripeError.message}`, { type: 'network_error' });
        } else if (stripeError.type === 'StripeInvalidRequestError') {
          // Handle invalid request errors (e.g., missing parameters)
          throw new functions.https.HttpsError('invalid-argument', stripeError.message, { type: 'validation_error' });
        }
      }
      
      if ('code' in error && typeof error.code === 'string' && error.code.startsWith('functions/')) {
        // Pass through existing HttpsError
        throw error;
      }
    }
    
    // Handle generic API errors or other unexpected errors
    let errorMessage = 'Failed to create Payment Intent. Contact support.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }
    
    throw new functions.https.HttpsError('internal', errorMessage, { type: 'unknown' });
  }
});
