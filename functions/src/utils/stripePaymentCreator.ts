
import * as functions from "firebase-functions";
import { stripe } from "../config/stripe";

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  metadata: {
    booking_reference?: string;
    transaction_id?: string;
    nights: number;
    rooms: number;
    guests: number;
    roomIds: string;
  };
}

export const createStripePaymentIntent = async (params: CreatePaymentIntentParams) => {
  try {
    console.log("STRIPE_UTIL: Creating Stripe payment intent with params:", JSON.stringify(params, null, 2));
    
    // Verify that Stripe is properly initialized
    if (!stripe) {
      console.error("STRIPE_UTIL: Stripe instance is not properly initialized");
      throw new functions.https.HttpsError(
        'internal',
        'Payment service unavailable',
        { type: 'stripe_initialization_error' }
      );
    }
    
    // Double-check before creating payment intent
    if (!stripe) {
      console.error("STRIPE_UTIL: Stripe instance is not available");
      throw new functions.https.HttpsError(
        'internal',
        'Payment service unavailable',
        { type: 'stripe_initialization_error' }
      );
    }
    
    // Create payment intent with detailed error handling
    const intentPayload = {
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    };
    
    console.log("STRIPE_UTIL: Calling stripe.paymentIntents.create with payload:", JSON.stringify(intentPayload, null, 2));
    
    const paymentIntent = await stripe.paymentIntents.create(intentPayload);

    console.log("STRIPE_UTIL: Payment intent created successfully. Response:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      clientSecret: paymentIntent.client_secret ? "present (masked)" : "missing",
      object: paymentIntent.object,
      created: paymentIntent.created,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      metadata: paymentIntent.metadata
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (stripeError: any) {
    console.error('STRIPE_UTIL: Error creating payment intent. Full error object:', 
      JSON.stringify(stripeError, Object.getOwnPropertyNames(stripeError)));
    
    console.error('STRIPE_UTIL: Stripe error creating payment intent:', {
      error: stripeError,
      code: stripeError.code,
      type: stripeError.type,
      message: stripeError.message,
      requestId: stripeError.requestId,
      rawType: stripeError.raw?.type,
      rawMessage: stripeError.raw?.message,
      stackTrace: stripeError.stack
    });

    if (stripeError.type === 'StripeCardError') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        stripeError.message,
        { 
          type: 'payment_failed', 
          details: { 
            stripeError: stripeError.message,
            code: stripeError.code,
            decline_code: stripeError.decline_code 
          } 
        }
      );
    } else if (stripeError.type === 'StripeAPIError') {
      throw new functions.https.HttpsError(
        'internal',
        'Payment processing error',
        { 
          type: 'stripe_api_error', 
          details: { 
            stripeError: stripeError.message,
            requestId: stripeError.requestId
          } 
        }
      );
    } else if (stripeError.type === 'StripeInvalidRequestError') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid payment request',
        { 
          type: 'invalid_request', 
          details: { 
            stripeError: stripeError.message,
            param: stripeError.param
          } 
        }
      );
    } else if (stripeError.type === 'StripeRateLimitError') {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many payment requests',
        { 
          type: 'rate_limit_error', 
          details: { 
            stripeError: stripeError.message 
          } 
        }
      );
    }
    
    // Handle any other Stripe error types
    throw new functions.https.HttpsError(
      'internal',
      stripeError.message || 'Unexpected payment processing error',
      { 
        type: 'stripe_unknown_error', 
        details: { 
          stripeError: stripeError.message,
          errorType: stripeError.type
        } 
      }
    );
  }
};
