
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import type { CreatePaymentIntentResponse } from "../types/booking.types";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRequest, schemas } from "../utils/validation";
import { logger } from "../utils/logger";

const createPaymentIntentHandler = async (request: any): Promise<CreatePaymentIntentResponse> => {
  console.log("🚀 PAYMENT_INTENT_HANDLER: ================ FUNCTION STARTED ================");
  console.log("🚀 PAYMENT_INTENT_HANDLER: Timestamp:", new Date().toISOString());
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request object:", JSON.stringify(request, null, 2));
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request.data:", JSON.stringify(request.data, null, 2));
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request keys:", Object.keys(request || {}));
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request.data keys:", Object.keys(request.data || {}));
  
  try {
    console.log("🚀 PAYMENT_INTENT_HANDLER: About to validate request data...");
    const validatedData = validateRequest(schemas.createPaymentIntent, request.data);
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Request validation successful");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Validated data:", JSON.stringify(validatedData, null, 2));
    
    const { rooms, period, guests, transaction_id, booking_reference, currency } = validatedData;
    console.log("🚀 PAYMENT_INTENT_HANDLER: Destructured data:", {
      roomsCount: rooms?.length,
      rooms: rooms,
      period: period,
      guests: guests,
      transaction_id: transaction_id,
      booking_reference: booking_reference,
      currency: currency
    });
    
    logger.setContext({ 
      transactionId: transaction_id,
      bookingReference: booking_reference,
      roomCount: rooms.length,
      guests 
    });
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: About to initialize Firebase Admin...");
    if (!admin.apps.length) {
      console.log("🚀 PAYMENT_INTENT_HANDLER: Initializing Firebase Admin");
      admin.initializeApp();
      console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Firebase Admin initialized");
    } else {
      console.log("🚀 PAYMENT_INTENT_HANDLER: Firebase Admin already initialized");
    }

    logger.info("Processing payment intent creation", { 
      roomCount: rooms.length, 
      period, 
      guests, 
      currency 
    });

    console.log("🚀 PAYMENT_INTENT_HANDLER: About to calculate number of nights...");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Period object:", period);
    const numberOfNights = calculateNumberOfNights(period);
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Number of nights calculated:", numberOfNights);
    
    if (numberOfNights <= 0) {
      console.error("🚀 PAYMENT_INTENT_HANDLER: ❌ Invalid number of nights:", numberOfNights);
      throw new HttpsError(
        "invalid-argument", 
        "Check-in must be before check-out date.",
        { type: "validation_error", field: "period" }
      );
    }

    logger.info("Booking duration calculated", { numberOfNights });

    console.log("🚀 PAYMENT_INTENT_HANDLER: About to calculate room prices...");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Rooms for pricing:", JSON.stringify(rooms, null, 2));
    console.log("🚀 PAYMENT_INTENT_HANDLER: Number of nights for pricing:", numberOfNights);
    
    const { totalAmount, roomPrices } = await calculateRoomPrices(rooms, numberOfNights);
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Room prices calculated:");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Total amount:", totalAmount);
    console.log("🚀 PAYMENT_INTENT_HANDLER: Room prices breakdown:", JSON.stringify(roomPrices, null, 2));
    
    logger.info("Pricing calculation completed", { 
      numberOfNights, 
      totalAmount, 
      roomPrices
    });

    console.log("🚀 PAYMENT_INTENT_HANDLER: Preparing Stripe payment intent parameters...");
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
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: Stripe parameters prepared:");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Stripe params:", JSON.stringify(stripeParams, null, 2));
    
    logger.info("Creating Stripe payment intent", { amount: totalAmount, currency });
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: About to call createStripePaymentIntent...");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Calling with params:", JSON.stringify(stripeParams, null, 2));
    
    const stripePaymentIntent = await createStripePaymentIntent(stripeParams);
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Stripe payment intent created!");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Stripe response:", JSON.stringify(stripePaymentIntent, null, 2));
    console.log("🚀 PAYMENT_INTENT_HANDLER: Client secret exists:", !!stripePaymentIntent.clientSecret);
    console.log("🚀 PAYMENT_INTENT_HANDLER: Payment intent ID:", stripePaymentIntent.paymentIntentId);

    logger.setContext({ paymentIntentId: stripePaymentIntent.paymentIntentId });
    logger.info("Payment intent created successfully");

    const response = {
      clientSecret: stripePaymentIntent.clientSecret,
      paymentIntentId: stripePaymentIntent.paymentIntentId,
      calculatedAmount: totalAmount,
      details: {
        nights: numberOfNights,
        roomCount: rooms.length
      }
    };
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ SUCCESS! Returning response:");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Final response:", JSON.stringify(response, null, 2));
    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ FUNCTION COMPLETED SUCCESSFULLY ================");
    
    return response;

  } catch (error: any) {
    console.error("🚀 PAYMENT_INTENT_HANDLER: ❌❌❌ CRITICAL ERROR CAUGHT! ❌❌❌");
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error timestamp:", new Date().toISOString());
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error type:", typeof error);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error constructor:", error?.constructor?.name);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error message:", error?.message);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error code:", error?.code);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error details:", error?.details);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error stack:", error?.stack);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Full error object:", error);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("🚀 PAYMENT_INTENT_HANDLER: Request data that caused error:", JSON.stringify(request.data, null, 2));
    
    logger.error("!!! UNHANDLED EXCEPTION IN createPaymentIntentHandler !!!", {
      errorMessage: error.message,
      errorCode: error.code,
      errorType: error.constructor.name,
      stack: error.stack,
      requestData: request.data,
      errorDetails: error.details || null,
      stripeErrorType: error.type || null,
      httpErrorCode: error.httpErrorCode || null
    });
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: About to re-throw error as HttpsError...");
    
    if (error instanceof HttpsError) {
      console.error("🚀 PAYMENT_INTENT_HANDLER: Error is already HttpsError, re-throwing as-is");
      throw error;
    }
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: Converting error to HttpsError");
    throw new HttpsError('internal', 'An unexpected error occurred while creating the payment intent.', {
      originalMessage: error.message,
      errorType: error.constructor.name
    });
  }
};

export const createPaymentIntent = onCall(createPaymentIntentHandler);
