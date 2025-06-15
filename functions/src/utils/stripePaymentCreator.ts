
import { getStripeClient } from "../config/stripe";
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

export const createStripePaymentIntent = async (params: CreatePaymentIntentParams): Promise<{
  clientSecret: string;
  paymentIntentId: string;
}> => {
  try {
    logger.info("Creating Stripe payment intent", { 
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata 
    });
    
    // Validate amount is within Stripe limits
    validateStripeAmount(params.amount, params.currency);
    
    // Get Stripe instance
    const stripe = getStripeClient();
    
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
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  } catch (stripeError: any) {
    // Use centralized Stripe error handling
    handleStripeError(stripeError, 'Payment intent creation');
    throw new Error('Unexpected code path'); // This won't be reached due to handleStripeError throwing
  }
};
