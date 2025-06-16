
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
  console.log("🔥 STRIPE_CREATOR: ================ STRIPE PAYMENT INTENT CREATION STARTED ================");
  console.log("🔥 STRIPE_CREATOR: Timestamp:", new Date().toISOString());
  console.log("🔥 STRIPE_CREATOR: Input parameters:", JSON.stringify(params, null, 2));
  console.log("🔥 STRIPE_CREATOR: Amount:", params.amount);
  console.log("🔥 STRIPE_CREATOR: Currency:", params.currency);
  console.log("🔥 STRIPE_CREATOR: Has idempotency key:", !!params.idempotencyKey);
  console.log("🔥 STRIPE_CREATOR: Metadata:", JSON.stringify(params.metadata, null, 2));
  
  try {
    logger.info("Creating Stripe payment intent", { 
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata 
    });
    
    console.log("🔥 STRIPE_CREATOR: About to validate Stripe amount...");
    validateStripeAmount(params.amount, params.currency);
    console.log("🔥 STRIPE_CREATOR: ✅ Amount validation passed");
    
    console.log("🔥 STRIPE_CREATOR: About to get Stripe client...");
    const stripe = getStripeClient();
    console.log("🔥 STRIPE_CREATOR: ✅ Stripe client obtained");
    console.log("🔥 STRIPE_CREATOR: Stripe client type:", typeof stripe);
    console.log("🔥 STRIPE_CREATOR: Stripe client constructor:", stripe?.constructor?.name);
    
    console.log("🔥 STRIPE_CREATOR: Preparing payment intent payload...");
    const intentPayload = {
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    };
    
    console.log("🔥 STRIPE_CREATOR: Payment intent payload prepared:");
    console.log("🔥 STRIPE_CREATOR: Payload:", JSON.stringify(intentPayload, null, 2));
    console.log("🔥 STRIPE_CREATOR: Amount in cents:", intentPayload.amount);
    
    const requestOptions: any = {};
    if (params.idempotencyKey) {
      requestOptions.idempotencyKey = params.idempotencyKey;
      console.log("🔥 STRIPE_CREATOR: Using idempotency key:", params.idempotencyKey);
      logger.debug("Using idempotency key for payment intent", { idempotencyKey: params.idempotencyKey });
    }
    
    console.log("🔥 STRIPE_CREATOR: Request options:", JSON.stringify(requestOptions, null, 2));
    logger.debug("Stripe payment intent payload", intentPayload);
    
    console.log("🔥 STRIPE_CREATOR: About to call stripe.paymentIntents.create...");
    console.log("🔥 STRIPE_CREATOR: Call timestamp:", new Date().toISOString());
    
    const paymentIntent = await stripe.paymentIntents.create(intentPayload, requestOptions);

    console.log("🔥 STRIPE_CREATOR: ✅ Stripe API call successful!");
    console.log("🔥 STRIPE_CREATOR: Payment intent created with ID:", paymentIntent.id);
    console.log("🔥 STRIPE_CREATOR: Payment intent status:", paymentIntent.status);
    console.log("🔥 STRIPE_CREATOR: Payment intent amount:", paymentIntent.amount);
    console.log("🔥 STRIPE_CREATOR: Payment intent currency:", paymentIntent.currency);
    console.log("🔥 STRIPE_CREATOR: Has client secret:", !!paymentIntent.client_secret);
    console.log("🔥 STRIPE_CREATOR: Client secret prefix:", paymentIntent.client_secret?.substring(0, 20) + '...');
    console.log("🔥 STRIPE_CREATOR: Full payment intent object:", JSON.stringify(paymentIntent, null, 2));

    logger.info("Payment intent created successfully", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      hasClientSecret: !!paymentIntent.client_secret
    });

    const result = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
    
    console.log("🔥 STRIPE_CREATOR: ✅ SUCCESS! Returning result:");
    console.log("🔥 STRIPE_CREATOR: Result:", JSON.stringify(result, null, 2));
    console.log("🔥 STRIPE_CREATOR: ================ STRIPE PAYMENT INTENT CREATION COMPLETED ================");

    return result;
  } catch (stripeError: any) {
    console.error("🔥 STRIPE_CREATOR: ❌❌❌ STRIPE ERROR OCCURRED! ❌❌❌");
    console.error("🔥 STRIPE_CREATOR: Error timestamp:", new Date().toISOString());
    console.error("🔥 STRIPE_CREATOR: Stripe error type:", typeof stripeError);
    console.error("🔥 STRIPE_CREATOR: Stripe error constructor:", stripeError?.constructor?.name);
    console.error("🔥 STRIPE_CREATOR: Stripe error message:", stripeError?.message);
    console.error("🔥 STRIPE_CREATOR: Stripe error code:", stripeError?.code);
    console.error("🔥 STRIPE_CREATOR: Stripe error type (Stripe):", stripeError?.type);
    console.error("🔥 STRIPE_CREATOR: Stripe error decline code:", stripeError?.decline_code);
    console.error("🔥 STRIPE_CREATOR: Stripe error param:", stripeError?.param);
    console.error("🔥 STRIPE_CREATOR: Stripe error stack:", stripeError?.stack);
    console.error("🔥 STRIPE_CREATOR: Full Stripe error:", stripeError);
    console.error("🔥 STRIPE_CREATOR: Stripe error JSON:", JSON.stringify(stripeError, Object.getOwnPropertyNames(stripeError), 2));
    console.error("🔥 STRIPE_CREATOR: Parameters that caused error:", JSON.stringify(params, null, 2));
    
    // Use centralized Stripe error handling
    handleStripeError(stripeError, 'Payment intent creation');
    throw new Error('Unexpected code path'); // This won't be reached due to handleStripeError throwing
  }
};
