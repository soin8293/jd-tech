import * as functions from "firebase-functions";
import { stripe } from "../config/stripe";
import * as admin from "firebase-admin";

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
    console.log("Creating payment intent with data:", JSON.stringify(data, null, 2));
    
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
    
    console.log(`Booking duration calculated: ${numberOfNights} nights`);
    
    // Initialize Firestore
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    
    const firestore = admin.firestore();
    let totalAmount = 0;
    
    // Enhanced room price retrieval with detailed logging
    for (const room of rooms) {
      try {
        if (!room.id) {
          console.error('Missing room ID:', { room });
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid room data: Missing room ID',
            { type: 'validation_error', details: { room } }
          );
        }
        
        console.log(`Fetching price for room ${room.id}`);
        const roomDoc = await firestore.collection('rooms').doc(room.id).get();
        
        if (!roomDoc.exists) {
          console.error(`Room ${room.id} not found in database`);
          throw new functions.https.HttpsError(
            'not-found',
            `Room ${room.id} not found in database`,
            { type: 'room_not_found', details: { roomId: room.id } }
          );
        }
        
        const roomData = roomDoc.data();
        if (!roomData || typeof roomData.price !== 'number') {
          console.error(`Invalid price data for room ${room.id}:`, roomData);
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Invalid price data for room: ${room.id}`,
            { type: 'invalid_price', details: { roomId: room.id, data: roomData } }
          );
        }
        
        const roomTotal = roomData.price * numberOfNights;
        totalAmount += roomTotal;
        console.log(`Room ${room.id} calculation: $${roomData.price} x ${numberOfNights} nights = $${roomTotal}`);
        
      } catch (error: any) {
        console.error(`Error processing room ${room.id}:`, error);
        throw new functions.https.HttpsError(
          'internal',
          `Failed to process room ${room.id}: ${error.message}`,
          { type: 'room_processing_error', details: { error: error.message, roomId: room.id } }
        );
      }
    }

    const amountInCents = Math.round(totalAmount * 100);
    console.log(`Final amount calculated: $${totalAmount} (${amountInCents} cents)`);
    
    if (amountInCents <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Total amount must be greater than zero',
        { type: 'invalid_amount', details: { amount: amountInCents } }
      );
    }

    // Create Stripe Payment Intent with enhanced error handling
    try {
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
        automatic_payment_methods: { enabled: true },
      });

      console.log(`Payment Intent created successfully:`, {
        id: paymentIntent.id,
        amount: amountInCents,
        currency,
        rooms: rooms.length,
        nights: numberOfNights
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        calculatedAmount: amountInCents / 100,
        details: {
          nights: numberOfNights,
          roomCount: rooms.length
        }
      };
    } catch (stripeError: any) {
      console.error('Stripe error creating payment intent:', {
        error: stripeError,
        code: stripeError.code,
        type: stripeError.type,
        message: stripeError.message
      });

      // Enhanced Stripe error handling
      if (stripeError.type === 'StripeCardError') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          stripeError.message,
          { type: 'payment_failed', details: { stripeError: stripeError.message } }
        );
      } else if (stripeError.type === 'StripeAPIError') {
        throw new functions.https.HttpsError(
          'internal',
          'Payment processing error',
          { type: 'stripe_api_error', details: { stripeError: stripeError.message } }
        );
      } else {
        throw new functions.https.HttpsError(
          'internal',
          'Unexpected payment processing error',
          { type: 'stripe_unknown_error', details: { stripeError: stripeError.message } }
        );
      }
    }
  } catch (error: any) {
    console.error('Error in createPaymentIntent:', error);
    
    // If it's already an HttpsError, throw it as is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Otherwise, wrap it in an HttpsError
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create payment intent',
      { type: 'unknown_error', details: { error: error.message } }
    );
  }
});
