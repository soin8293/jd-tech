import * as functions from "firebase-functions";
import { stripe } from "../config/stripe";
import * as admin from "firebase/admin";

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
  try {
    // 1. Authentication Check (Optional but Recommended for Production)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to create a payment intent.");
    // }

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
    // Fetch room prices from Firestore for security
    let totalAmount = 0;
    
    // SECURITY ENHANCEMENT: In production, always fetch room prices from Firestore
    // Initialize Firestore if it hasn't been initialized
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    
    const firestore = admin.firestore();
    
    for (const room of rooms) {
      try {
        if (!room.id) {
          console.error('Invalid room data: Missing room ID', { rooms });
          throw new functions.https.HttpsError('invalid-argument', 'Invalid room data: Missing room ID', {
            type: 'validation_error',
            details: { rooms }
          });
        }
        
        const roomDoc = await firestore.collection('rooms').doc(room.id).get();
        if (!roomDoc.exists) {
          throw new functions.https.HttpsError("not-found", `Room ${room.id} not found in database`);
        }
        
        const roomData = roomDoc.data();
        if (!roomData || typeof roomData.price !== 'number') {
          throw new functions.https.HttpsError("invalid-argument", `Invalid price for room: ${room.id}`);
        }
        
        totalAmount += roomData.price * numberOfNights;
        console.log(`Room ${room.id} price: $${roomData.price} x ${numberOfNights} nights = $${roomData.price * numberOfNights}`);
      } catch (error) {
        console.error(`Error fetching room ${room.id}:`, error);
        throw new functions.https.HttpsError("internal", `Failed to fetch room data: ${error.message}`);
      }
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
        guests: guests || 1,
        roomIds: rooms.map(room => room.id).join(',')
      },
      automatic_payment_methods: { enabled: true }, // Enable automatic payment methods for convenience
    });

    console.log(`Payment Intent created successfully: ${paymentIntent.id}`, {
      amount: amountInCents,
      currency,
      rooms: rooms.length,
      nights: numberOfNights
    });

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
    
    // Detailed Stripe error handling
    if (error instanceof Error) {
      console.error('Detailed Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // More specific error type and message handling
    if (typeof error === 'object' && error !== null) {
      if ('type' in error) {
        const stripeError = error as { type: string; message: string };
        
        // Specific error type handling
        switch (stripeError.type) {
          case 'StripeCardError':
            throw new functions.https.HttpsError('failed-precondition', stripeError.message, { 
              type: 'payment_failed', 
              details: { 
                stripeMessage: stripeError.message 
              } 
            });
          
          case 'StripeAPIError':
            throw new functions.https.HttpsError('internal', `Stripe API error: ${stripeError.message}`, { 
              type: 'system_error' 
            });
          
          default:
            throw new functions.https.HttpsError('internal', 'Unexpected payment processing error', { 
              type: 'unknown',
              details: stripeError
            });
        }
      }
    }
    
    // Fallback error handling
    throw new functions.https.HttpsError('internal', 'Failed to create Payment Intent', { 
      type: 'unknown_error' 
    });
  }
});
