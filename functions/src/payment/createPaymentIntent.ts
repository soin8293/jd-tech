
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import type { CreatePaymentIntentResponse } from "../types/booking.types";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRequest, schemas } from "../utils/validation";
import { logger } from "../utils/logger";

const createPaymentIntentHandler = async (request: any): Promise<CreatePaymentIntentResponse> => {
  // ===================================================================
  // START OF THE MASTER ERROR HANDLER
  // ===================================================================
  try {
    // All of the existing logic goes inside this try block
    const validatedData = validateRequest(schemas.createPaymentIntent, request.data);
    const { rooms, period, guests, transaction_id, booking_reference, currency } = validatedData;
    
    logger.setContext({ 
      transactionId: transaction_id,
      bookingReference: booking_reference,
      roomCount: rooms.length,
      guests 
    });
    
    // Initialize Firebase Admin if needed (must be done before any admin operations)
    if (!admin.apps.length) {
      logger.info("Initializing Firebase Admin");
      admin.initializeApp();
    }

    logger.info("Processing payment intent creation", { 
      roomCount: rooms.length, 
      period, 
      guests, 
      currency 
    });

    // Calculate booking duration
    logger.info("Calculating number of nights");
    const numberOfNights = calculateNumberOfNights(period);
    
    if (numberOfNights <= 0) {
      throw new HttpsError(
        "invalid-argument", 
        "Check-in must be before check-out date.",
        { type: "validation_error", field: "period" }
      );
    }

    logger.info("Booking duration calculated", { numberOfNights });

    // Calculate pricing
    logger.info("Calculating room prices");
    const { totalAmount, roomPrices } = await calculateRoomPrices(rooms, numberOfNights);
    
    logger.info("Pricing calculation completed", { 
      numberOfNights, 
      totalAmount, 
      roomPrices
    });

    // Prepare Stripe payment intent parameters with idempotency key
    const idempotencyKey = transaction_id ? `payment_intent_${transaction_id}` : undefined;
    const stripeParams = {
      amount: totalAmount,
      currency: currency ?? 'usd',
      idempotencyKey,
      metadata: {
        booking_reference: booking_reference || '',
        transaction_id: transaction_id || '',
        nights: numberOfNights,
        rooms: rooms.length,
        guests: guests || 1,
        roomIds: rooms.map(room => room.id).join(',')
      }
    };
    
    logger.info("Creating Stripe payment intent", { amount: totalAmount, currency });
    const stripePaymentIntent = await createStripePaymentIntent(stripeParams);

    logger.setContext({ paymentIntentId: stripePaymentIntent.paymentIntentId });
    logger.info("Payment intent created successfully");

    return {
      clientSecret: stripePaymentIntent.clientSecret,
      paymentIntentId: stripePaymentIntent.paymentIntentId,
      calculatedAmount: totalAmount,
      details: {
        nights: numberOfNights,
        roomCount: rooms.length
      }
    };

  } catch (error: any) {
    // ===================================================================
    // THE CATCH BLOCK
    // If ANY error happens above, it will be caught here.
    // ===================================================================
    logger.error("!!! UNHANDLED EXCEPTION IN createPaymentIntentHandler !!!", {
      errorMessage: error.message,
      errorCode: error.code,
      errorType: error.constructor.name,
      stack: error.stack,
      requestData: request.data, // Log the data that caused the error
      errorDetails: error.details || null,
      stripeErrorType: error.type || null,
      httpErrorCode: error.httpErrorCode || null
    });
    
    // If it's already an HttpsError, re-throw it as-is
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Re-throw the error as a proper HttpsError so the client gets a clean response
    // instead of a generic 'internal' error.
    throw new HttpsError('internal', 'An unexpected error occurred while creating the payment intent.', {
      originalMessage: error.message,
      errorType: error.constructor.name
    });
  }
};

// Simplified export without asyncHandler wrapper to avoid double error handling
export const createPaymentIntent = onCall(createPaymentIntentHandler);
