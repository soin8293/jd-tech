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

  } catch (error: any) {
    // 10. Enhanced Error Handling
    console.error("Error creating Payment Intent:", error);
    
    if (error.type === 'StripeCardError') {
      // Handle specific Stripe card errors (e.g., card declined)
      throw new functions.https.HttpsError('failed-precondition', error.message, { type: 'payment_failed' });
    } else if (error.type === 'StripeAPIError') {
      // Handle Stripe API errors
      throw new functions.https.HttpsError('internal', `Stripe API error: ${error.message}`, { type: 'system_error' });
    } else if (error.type === 'StripeConnectionError') {
      // Handle Stripe connection errors (network issues)
      throw new functions.https.HttpsError('unavailable', `Connection to Stripe failed: ${error.message}`, { type: 'network_error' });
    } else if (error.type === 'StripeInvalidRequestError') {
      // Handle invalid request errors (e.g., missing parameters)
      throw new functions.https.HttpsError('invalid-argument', error.message, { type: 'validation_error' });
    } else if (error.code && error.code.startsWith('functions/')) {
      // Pass through existing HttpsError
      throw error;
    } else {
      // Handle generic API errors or other unexpected errors
      throw new functions.https.HttpsError('internal', 'Failed to create Payment Intent. Contact support.', { type: 'unknown' });
    }
  }
});

/**
 * Firebase Cloud Function to process a booking after payment.
 * Verifies payment status with Stripe before confirming the booking.
 */
exports.processBooking = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    } catch (stripeError) {
      console.error("Error retrieving payment intent from Stripe:", stripeError);
      throw new functions.https.HttpsError(
        "unavailable",
        "Could not verify payment status with Stripe. Please try again later.",
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
    } catch (firestoreError) {
      console.error("Error storing booking in Firestore:", firestoreError);
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
    
  } catch (error: any) {
    console.error("Error processing booking:", error);
    
    // Enhanced error categorization for better client-side handling
    let errorType = 'unknown';
    let errorMessage = error.message || 'Failed to process booking. Please try again.';
    
    // If the error is from our HttpsError, use its type
    if (error.code && error.code.startsWith('functions/')) {
      if (error.details && error.details.type) {
        errorType = error.details.type;
      } else {
        // Map HttpsError codes to our error types
        const codeToType: Record<string, string> = {
          'functions/invalid-argument': 'validation_error',
          'functions/failed-precondition': 'payment_failed',
          'functions/unavailable': 'network_error',
          'functions/internal': 'system_error'
        };
        errorType = codeToType[error.code] || 'booking_failed';
      }
    } else if (error.type) {
      // If it's a Stripe error, map its type
      if (error.type.startsWith('Stripe')) {
        errorType = 'payment_failed';
        errorMessage = `Payment processing error: ${error.message}`;
      }
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

// Optional: Add a Stripe webhook handler for asynchronous payment events
// Uncomment and deploy if you want to handle payment events via webhooks
/*
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const webhookSecret = functions.config().stripe.webhook_secret;
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle specific events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('PaymentIntent succeeded:', paymentIntent.id);
    
    // Update booking status if needed
    const bookingRef = await admin.firestore()
      .collection('bookings')
      .where('paymentIntentId', '==', paymentIntent.id)
      .limit(1)
      .get();
      
    if (!bookingRef.empty) {
      const booking = bookingRef.docs[0];
      await booking.ref.update({ 
        status: 'confirmed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Updated booking ${booking.id} status to confirmed`);
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
    
    // Update booking status to failed
    const bookingRef = await admin.firestore()
      .collection('bookings')
      .where('paymentIntentId', '==', paymentIntent.id)
      .limit(1)
      .get();
      
    if (!bookingRef.empty) {
      const booking = bookingRef.docs[0];
      await booking.ref.update({ 
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Updated booking ${booking.id} status to failed`);
    }
  }
  
  // Return a 200 response
  res.status(200).send({ received: true });
});
*/
