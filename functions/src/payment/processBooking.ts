
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStripeClient } from "../config/stripe";
import type { PaymentResponse } from "../types/booking.process.types";
import { storeBookingData } from "../utils/bookingDataStore";
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

  // Verify payment status with Stripe
  logger.info("Retrieving payment intent from Stripe");
  let paymentIntent: Stripe.PaymentIntent | null = null;
  try {
    const stripe = getStripeClient();
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    logger.info("Payment intent retrieved successfully", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: new Date(paymentIntent.created * 1000).toISOString()
    });
  } catch (stripeError: any) {
    // Log only serializable properties to avoid circular structure error
    console.error("Stripe error in processBooking:", {
      message: stripeError.message,
      code: stripeError.code,
      type: stripeError.type,
      name: stripeError.name
    });
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
    console.error("Failed to store booking data:", {
      message: error.message,
      code: error.code,
      type: error.type,
      name: error.name
    });
    
    return {
      success: true,
      partial: true,
      bookingId: bookingId,
      paymentStatus: paymentIntent!.status,
      message: "Payment successful, but booking details could not be saved. Please contact support with your transaction ID."
    };
  }
};

export const processBooking = onCall({
  cors: [
    "https://jd-suites-backend.web.app",
    "https://jd-suites-backend.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com"
  ]
}, processBookingHandler);
