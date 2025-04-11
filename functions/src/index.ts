
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
    let totalAmount = 0;
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

/**
 * Firebase Cloud Function to process a booking after payment.
 * This is a placeholder for your actual booking processing logic.
 */
exports.processBooking = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    console.log("Processing booking with data:", data);
    
    // Here you would typically:
    // 1. Verify the payment with Stripe
    // 2. Create a booking record in Firestore
    // 3. Send confirmation emails
    // 4. Update room availability
    
    // For demonstration, we'll just return a success response with a generated booking ID
    const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    console.log(`Booking processed successfully. Booking ID: ${bookingId}`);
    
    return {
      success: true,
      bookingId: bookingId,
      message: "Booking confirmed successfully!"
    };
    
  } catch (error: any) {
    console.error("Error processing booking:", error);
    return {
      success: false,
      error: {
        type: 'booking_failed',
        message: error.message || 'Failed to process booking. Please try again.'
      }
    };
  }
});
