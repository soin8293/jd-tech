import { onCall, HttpsError } from "firebase-functions/v2/https";
import { stripe } from "../config/stripe";
import type { PaymentResponse } from "../types/booking.process.types";
import { storeBookingData } from "../utils/bookingDataStore";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRequest, schemas } from "../utils/validation";
import { logger } from "../utils/logger";
import { transactionManager } from "../utils/transactionManager";
import { handleStripeError } from "../utils/stripeHelpers";
import type Stripe from "stripe";

const processBookingHandler = async (request: any): Promise<PaymentResponse> => {
  // Validate request data
  const validatedData = validateRequest(schemas.processBooking, request.data);
  const { paymentIntentId } = validatedData;
  
  logger.setContext({ 
    paymentIntentId,
    transactionId: validatedData.transaction_id,
    userEmail: validatedData.userEmail 
  });
  
  logger.info("Processing booking", {
    paymentIntentId,
    paymentType: validatedData.paymentType,
    userEmail: validatedData.userEmail || 'not provided',
    roomCount: validatedData.bookingDetails?.rooms?.length || 0,
  });

  // Verify Stripe is available
  const stripeInstance = stripe();
  if (!stripeInstance) {
    throw new HttpsError(
      'internal',
      'Payment service unavailable',
      { type: 'configuration_error' }
    );
  }
  
  // Verify payment status with Stripe
  logger.info("Retrieving payment intent from Stripe");
  let paymentIntent: Stripe.PaymentIntent | null = null;
  try {
    paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
    
    logger.info("Payment intent retrieved successfully", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: new Date(paymentIntent.created * 1000).toISOString()
    });
  } catch (stripeError: any) {
    handleStripeError(stripeError, 'Payment intent retrieval');
  }
  
  // Check if payment is successful
  if (!paymentIntent || paymentIntent.status !== 'succeeded') {
    logger.warn("Payment verification failed", {
      paymentIntentId,
      currentStatus: paymentIntent?.status ?? 'null'
    });
    
    throw new HttpsError(
      "failed-precondition", 
      `Payment not completed successfully. Current status: ${paymentIntent?.status ?? 'null'}`,
      { type: 'payment_failed' }
    );
  }
  
  logger.info("Payment verified successfully");
  
  // Generate booking ID
  const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  logger.setContext({ bookingId });
  
  try {
    // Store booking in Firestore with transaction support
    await transactionManager.execute(async (transaction) => {
      await storeBookingData(bookingId, paymentIntent!, validatedData, transaction);
    });
    
    logger.info("Booking processed successfully");
    return {
      success: true,
      bookingId: bookingId,
      paymentStatus: paymentIntent!.status,
      message: "Booking confirmed successfully!"
    };
    
  } catch (error: any) {
    // Payment was successful, but we couldn't store the booking
    logger.error("Failed to store booking data", error);
    
    return {
      success: true,
      partial: true,
      bookingId: bookingId,
      paymentStatus: paymentIntent!.status,
      message: "Payment successful, but booking details could not be saved. Please contact support with your transaction ID."
    };
  }
};

export const processBooking = onCall(
  asyncHandler(processBookingHandler, 'processBooking')
);