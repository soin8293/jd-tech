
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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (stripeError: any) {
    console.error('Stripe error creating payment intent:', {
      error: stripeError,
      code: stripeError.code,
      type: stripeError.type,
      message: stripeError.message
    });

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
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Unexpected payment processing error',
      { type: 'stripe_unknown_error', details: { stripeError: stripeError.message } }
    );
  }
};
