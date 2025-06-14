import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import { CreatePaymentIntentData, CreatePaymentIntentResponse } from "../types/booking.types";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRequest, schemas } from "../utils/validation";
import { logger } from "../utils/logger";

const createPaymentIntentHandler = async (request: any): Promise<CreatePaymentIntentResponse> => {
  // Validate request data
  const validatedData = validateRequest(schemas.createPaymentIntent, request.data);
  const { rooms, period, guests, transaction_id, booking_reference, currency } = validatedData;
  
  logger.setContext({ 
    transactionId: transaction_id,
    bookingReference: booking_reference,
    roomCount: rooms.length,
    guests 
  });
  
  logger.info("Processing payment intent creation", { 
    roomCount: rooms.length, 
    period, 
    guests, 
    currency 
  });

  // Initialize Firebase Admin if needed
  if (!admin.apps.length) {
    logger.info("Initializing Firebase Admin");
    admin.initializeApp();
  }

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
    currency,
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
};

export const createPaymentIntent = onCall(
  asyncHandler(createPaymentIntentHandler, 'createPaymentIntent')
);