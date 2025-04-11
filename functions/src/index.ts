
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const stripe = require('stripe')(functions.config().stripe.secret_key); // Initialize Stripe with Secret Key from environment variables

admin.initializeApp(); // Initialize Firebase Admin SDK

/**
 * Firebase Cloud Function to create a Stripe Payment Intent.
 * @param {Object} data - The request data containing booking details.
 * @param {Object} context - The Firebase Functions context.
 * @returns {Object} - Response containing the clientSecret for the Payment Intent.
 */
exports.createPaymentIntent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // 1. Authentication Check (Optional but Recommended for Production)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to create a payment intent.");
  // }

  try {
    // 2. Extract booking details from request
    const { rooms, period, guests, transaction_id, booking_reference } = data;
    const currency = data.currency || "usd"; // Default to USD if currency is not provided

    // 3. Input Validation
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "No rooms provided for booking.");
    }
    
    if (!period || !period.checkIn || !period.checkOut) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid booking period.");
    }

    // 4. Calculate number of nights
    const checkIn = new Date(period.checkIn);
    const checkOut = new Date(period.checkOut);
    const numberOfNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
    
    // 5. Calculate total price from room details and nights
    let totalAmount = 0;
    for (const room of rooms) {
      if (!room.price || typeof room.price !== 'number') {
        throw new functions.https.HttpsError("invalid-argument", `Invalid price for room: ${room.id || 'unknown'}`);
      }
      totalAmount += room.price * numberOfNights;
    }

    // 6. Apply taxes, fees, or discounts if needed
    // const taxRate = 0.08; // 8% tax rate example
    // totalAmount += totalAmount * taxRate;

    // 7. Convert to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);
    
    if (amountInCents <= 0) {
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

    // 9. Return Client Secret to the Frontend
    return { 
      clientSecret: paymentIntent.client_secret,
      calculatedAmount: amountInCents / 100, // Send back the calculated amount for validation
      details: {
        nights: numberOfNights,
        roomCount: rooms.length
      }
    };

  } catch (error: any) {
    // 10. Error Handling
    console.error("Error creating Payment Intent:", error);
    if (error.type === 'StripeCardError') {
      // Handle specific Stripe card errors (e.g., card declined)
      throw new functions.https.HttpsError('payment-failed', error.message);
    } else if (error.type === 'StripeAPIError') {
      // Handle Stripe API errors
      throw new functions.https.HttpsError('internal', `Stripe API error: ${error.message}`);
    } else if (error.code && error.code.startsWith('functions/')) {
      // Pass through existing HttpsError
      throw error;
    } else {
      // Handle generic API errors or other unexpected errors
      throw new functions.https.HttpsError('internal', 'Failed to create Payment Intent. Contact support.');
    }
  }
});
