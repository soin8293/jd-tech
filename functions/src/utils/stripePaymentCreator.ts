
import * as functions from "firebase-functions";
import { stripe } from "../config/stripe";
import { logger } from "./logger";
import { handleStripeError, validateStripeAmount } from "./stripeHelpers";

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  idempotencyKey?: string;
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
    logger.info("Creating Stripe payment intent", { 
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata 
    });
    
    // Verify that Stripe is properly initialized
    if (!stripe) {
      logger.error("Stripe instance is not properly initialized");
      throw new functions.https.HttpsError(
        'internal',
        'Payment service unavailable',
        { type: 'stripe_initialization_error' }
      );
    }
    
    // Validate amount is within Stripe limits
    validateStripeAmount(params.amount, params.currency);
    
    // Create payment intent with detailed error handling and idempotency
    const intentPayload = {
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    };
    
    const requestOptions: any = {};
    if (params.idempotencyKey) {
      requestOptions.idempotencyKey = params.idempotencyKey;
      logger.debug("Using idempotency key for payment intent", { idempotencyKey: params.idempotencyKey });
    }
    
    logger.debug("Stripe payment intent payload", intentPayload);
    
    const paymentIntent = await stripe.paymentIntents.create(intentPayload, requestOptions);

    logger.info("Payment intent created successfully", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      hasClientSecret: !!paymentIntent.client_secret
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (stripeError: any) {
    // Use centralized Stripe error handling
    handleStripeError(stripeError, 'Payment intent creation');
  }
};
