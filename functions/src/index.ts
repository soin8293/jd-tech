import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const stripe = require('stripe')(functions.config().stripe.secret_key); // Initialize Stripe with Secret Key from environment variables

admin.initializeApp(); // Initialize Firebase Admin SDK

/**
 * Firebase Cloud Function to create a Stripe Payment Intent.
 * @param {Object} data - The request data containing amount and currency.
 * @param {Object} context - The Firebase Functions context.
 * @returns {Object} - Response containing the clientSecret for the Payment Intent.
 */
exports.createPaymentIntent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // 1. Authentication Check (Optional but Recommended for Production)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to create a payment intent.");
  // }

  // 2. Input Validation
  const amount = data.amount; // Amount in cents (or smallest currency unit)
  const currency = data.currency || "usd"; // Default to USD if currency is not provided

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Amount must be a positive number.");
  }
  if (!currency || typeof currency !== 'string' || currency.length !== 3) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid currency code.");
  }

  try {
    // 3. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: { enabled: true }, // Enable automatic payment methods for convenience
    });

    // 4. Return Client Secret to the Frontend
    return { clientSecret: paymentIntent.client_secret };

  } catch (error: any) {
    // 5. Error Handling
    console.error("Error creating Payment Intent:", error);
    if (error.type === 'StripeCardError') {
      // Handle specific Stripe card errors (e.g., card declined)
      throw new functions.https.HttpsError('payment-failed', error.message);
    } else if (error.type === 'StripeAPIError') {
      // Handle Stripe API errors
      throw new functions.https.HttpsError('internal', `Stripe API error: ${error.message}`);
    }
     else {
      // Handle generic API errors or other unexpected errors
      throw new functions.https.HttpsError('internal', 'Failed to create Payment Intent. Contact support.');
    }
  }
});