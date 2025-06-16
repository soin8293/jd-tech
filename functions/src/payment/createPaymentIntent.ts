
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import type { CreatePaymentIntentResponse } from "../types/booking.types";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRequest, schemas } from "../utils/validation";
import { logger } from "../utils/logger";

const createPaymentIntentHandler = async (request: any): Promise<CreatePaymentIntentResponse> => {
  console.log("🚀 PAYMENT_INTENT_HANDLER: ================ ULTRA VERBOSE FUNCTION EXECUTION START ================");
  console.log("🚀 PAYMENT_INTENT_HANDLER: Function invocation timestamp:", new Date().toISOString());
  console.log("🚀 PAYMENT_INTENT_HANDLER: Function execution ID:", Math.random().toString(36).substring(2, 15));
  console.log("🚀 PAYMENT_INTENT_HANDLER: Node.js version:", process.version);
  console.log("🚀 PAYMENT_INTENT_HANDLER: Platform:", process.platform);
  console.log("🚀 PAYMENT_INTENT_HANDLER: Architecture:", process.arch);
  console.log("🚀 PAYMENT_INTENT_HANDLER: Memory usage:", process.memoryUsage());
  console.log("🚀 PAYMENT_INTENT_HANDLER: Environment variables check:", {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV,
    gcpProject: process.env.GCP_PROJECT,
    functionName: process.env.FUNCTION_NAME,
    functionRegion: process.env.FUNCTION_REGION
  });
  
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request object ultra-detailed analysis:");
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request exists:", !!request);
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request type:", typeof request);
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request constructor:", request?.constructor?.name);
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request prototype:", Object.getPrototypeOf(request || {})?.constructor?.name);
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request keys:", Object.keys(request || {}));
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request own properties:", Object.getOwnPropertyNames(request || {}));
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request descriptors:", Object.getOwnPropertyDescriptors(request || {}));
  console.log("🚀 PAYMENT_INTENT_HANDLER: Request JSON serialization:", JSON.stringify(request, null, 2));
  
  if (request?.data) {
    console.log("🚀 PAYMENT_INTENT_HANDLER: Request.data ultra-detailed analysis:");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Data exists:", !!request.data);
    console.log("🚀 PAYMENT_INTENT_HANDLER: Data type:", typeof request.data);
    console.log("🚀 PAYMENT_INTENT_HANDLER: Data constructor:", request.data?.constructor?.name);
    console.log("🚀 PAYMENT_INTENT_HANDLER: Data keys:", Object.keys(request.data || {}));
    console.log("🚀 PAYMENT_INTENT_HANDLER: Data own properties:", Object.getOwnPropertyNames(request.data || {}));
    console.log("🚀 PAYMENT_INTENT_HANDLER: Data JSON:", JSON.stringify(request.data, null, 2));
    console.log("🚀 PAYMENT_INTENT_HANDLER: Data size (bytes):", JSON.stringify(request.data).length);
  } else {
    console.error("🚀 PAYMENT_INTENT_HANDLER: ❌ CRITICAL: request.data is missing or falsy!");
  }
  
  try {
    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ STARTING REQUEST VALIDATION ================");
    console.log("🚀 PAYMENT_INTENT_HANDLER: About to validate request data using schemas.createPaymentIntent...");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Validation schema available:", !!schemas?.createPaymentIntent);
    console.log("🚀 PAYMENT_INTENT_HANDLER: validateRequest function available:", typeof validateRequest === 'function');
    
    const validatedData = validateRequest(schemas.createPaymentIntent, request.data);
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Request validation successful!");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Validated data structure:", {
      hasRooms: !!validatedData.rooms,
      roomsCount: validatedData.rooms?.length || 0,
      hasPeriod: !!validatedData.period,
      hasGuests: !!validatedData.guests,
      hasTransactionId: !!validatedData.transaction_id,
      hasCurrency: !!validatedData.currency
    });
    console.log("🚀 PAYMENT_INTENT_HANDLER: Validated data JSON:", JSON.stringify(validatedData, null, 2));
    
    const { rooms, period, guests, transaction_id, booking_reference, currency } = validatedData;
    console.log("🚀 PAYMENT_INTENT_HANDLER: Destructured variables:", {
      roomsType: typeof rooms,
      roomsLength: rooms?.length,
      periodType: typeof period,
      periodKeys: Object.keys(period || {}),
      guestsType: typeof guests,
      guestsValue: guests,
      transactionIdType: typeof transaction_id,
      transactionIdLength: transaction_id?.length,
      bookingReferenceType: typeof booking_reference,
      currencyType: typeof currency,
      currencyValue: currency
    });
    
    logger.setContext({ 
      transactionId: transaction_id,
      bookingReference: booking_reference,
      roomCount: rooms.length,
      guests 
    });
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ FIREBASE ADMIN INITIALIZATION ================");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Checking Firebase Admin initialization status...");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Admin apps length:", admin.apps?.length || 0);
    console.log("🚀 PAYMENT_INTENT_HANDLER: Admin apps:", admin.apps?.map(app => ({
      name: app.name,
      projectId: app.options?.projectId
    })) || []);
    
    if (!admin.apps.length) {
      console.log("🚀 PAYMENT_INTENT_HANDLER: Initializing Firebase Admin SDK...");
      const initStartTime = Date.now();
      admin.initializeApp();
      const initEndTime = Date.now();
      console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Firebase Admin SDK initialized successfully!");
      console.log("🚀 PAYMENT_INTENT_HANDLER: Initialization took:", (initEndTime - initStartTime) + 'ms');
      console.log("🚀 PAYMENT_INTENT_HANDLER: Admin app details:", {
        name: admin.apps[0]?.name,
        projectId: admin.apps[0]?.options?.projectId
      });
    } else {
      console.log("🚀 PAYMENT_INTENT_HANDLER: Firebase Admin SDK already initialized");
      console.log("🚀 PAYMENT_INTENT_HANDLER: Existing app details:", {
        count: admin.apps.length,
        names: admin.apps.map(app => app.name),
        projectIds: admin.apps.map(app => app.options?.projectId)
      });
    }

    logger.info("Processing payment intent creation", { 
      roomCount: rooms.length, 
      period, 
      guests, 
      currency 
    });

    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ CALCULATING NUMBER OF NIGHTS ================");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Period object detailed analysis:", {
      period,
      periodType: typeof period,
      periodConstructor: period?.constructor?.name,
      periodKeys: Object.keys(period || {}),
      checkIn: {
        value: period?.checkIn,
        type: typeof period?.checkIn,
        constructor: period?.checkIn?.constructor?.name,
        isString: typeof period?.checkIn === 'string',
        length: period?.checkIn?.length || 0
      },
      checkOut: {
        value: period?.checkOut,
        type: typeof period?.checkOut,
        constructor: period?.checkOut?.constructor?.name,
        isString: typeof period?.checkOut === 'string',
        length: period?.checkOut?.length || 0
      }
    });
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: About to call calculateNumberOfNights...");
    const nightsCalcStartTime = Date.now();
    const numberOfNights = calculateNumberOfNights(period);
    const nightsCalcEndTime = Date.now();
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Number of nights calculation completed!");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Calculation details:", {
      numberOfNights,
      calculationType: typeof numberOfNights,
      isValidNumber: typeof numberOfNights === 'number' && !isNaN(numberOfNights),
      isPositive: numberOfNights > 0,
      calculationTime: (nightsCalcEndTime - nightsCalcStartTime) + 'ms'
    });
    
    if (numberOfNights <= 0) {
      console.error("🚀 PAYMENT_INTENT_HANDLER: ❌ CRITICAL ERROR: Invalid number of nights:", numberOfNights);
      console.error("🚀 PAYMENT_INTENT_HANDLER: Period data that caused error:", {
        checkIn: period.checkIn,
        checkOut: period.checkOut,
        numberOfNights
      });
      throw new HttpsError(
        "invalid-argument", 
        "Check-in must be before check-out date.",
        { type: "validation_error", field: "period", numberOfNights }
      );
    }

    logger.info("Booking duration calculated", { numberOfNights });

    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ CALCULATING ROOM PRICES ================");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Rooms for pricing detailed analysis:");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Rooms array:", {
      isArray: Array.isArray(rooms),
      length: rooms?.length || 0,
      totalElements: rooms?.length || 0
    });
    
    rooms?.forEach((room, index) => {
      console.log(`🚀 PAYMENT_INTENT_HANDLER: Room ${index + 1} analysis:`, {
        id: room.id,
        name: room.name,
        price: room.price,
        priceType: typeof room.price,
        capacity: room.capacity,
        allKeys: Object.keys(room),
        roomSize: JSON.stringify(room).length + ' characters'
      });
    });
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: About to call calculateRoomPrices with:", {
      roomsCount: rooms.length,
      numberOfNights
    });
    
    const priceCalcStartTime = Date.now();
    const { totalAmount, roomPrices } = await calculateRoomPrices(rooms, numberOfNights);
    const priceCalcEndTime = Date.now();
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Room prices calculation completed!");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Pricing results ultra-detailed:", {
      totalAmount,
      totalAmountType: typeof totalAmount,
      isValidAmount: typeof totalAmount === 'number' && !isNaN(totalAmount) && totalAmount > 0,
      roomPricesType: typeof roomPrices,
      roomPricesIsArray: Array.isArray(roomPrices),
      roomPricesLength: roomPrices?.length || 0,
      calculationTime: (priceCalcEndTime - priceCalcStartTime) + 'ms',
      roomPricesDetailed: roomPrices
    });
    
    logger.info("Pricing calculation completed", { 
      numberOfNights, 
      totalAmount, 
      roomPrices
    });

    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ PREPARING STRIPE PAYMENT INTENT ================");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Preparing Stripe payment intent parameters...");
    
    const idempotencyKey = transaction_id ? `payment_intent_${transaction_id}` : undefined;
    console.log("🚀 PAYMENT_INTENT_HANDLER: Idempotency key:", {
      hasTransactionId: !!transaction_id,
      transactionId,
      idempotencyKey,
      keyLength: idempotencyKey?.length || 0
    });
    
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
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: Stripe parameters ultra-detailed preparation:");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Stripe params structure:", {
      amount: {
        value: stripeParams.amount,
        type: typeof stripeParams.amount,
        isNumber: typeof stripeParams.amount === 'number',
        isPositive: stripeParams.amount > 0,
        inCents: Math.round(stripeParams.amount * 100)
      },
      currency: {
        value: stripeParams.currency,
        type: typeof stripeParams.currency,
        length: stripeParams.currency?.length || 0
      },
      idempotencyKey: {
        value: stripeParams.idempotencyKey,
        type: typeof stripeParams.idempotencyKey,
        length: stripeParams.idempotencyKey?.length || 0,
        hasKey: !!stripeParams.idempotencyKey
      },
      metadata: {
        type: typeof stripeParams.metadata,
        keys: Object.keys(stripeParams.metadata || {}),
        values: stripeParams.metadata,
        size: JSON.stringify(stripeParams.metadata).length + ' characters'
      }
    });
    console.log("🚀 PAYMENT_INTENT_HANDLER: Complete Stripe params JSON:", JSON.stringify(stripeParams, null, 2));
    
    logger.info("Creating Stripe payment intent", { amount: totalAmount, currency });
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ CALLING STRIPE PAYMENT INTENT CREATOR ================");
    console.log("🚀 PAYMENT_INTENT_HANDLER: About to call createStripePaymentIntent...");
    console.log("🚀 PAYMENT_INTENT_HANDLER: createStripePaymentIntent function available:", typeof createStripePaymentIntent === 'function');
    console.log("🚀 PAYMENT_INTENT_HANDLER: Call timestamp:", new Date().toISOString());
    
    const stripeCallStartTime = Date.now();
    const stripePaymentIntent = await createStripePaymentIntent(stripeParams);
    const stripeCallEndTime = Date.now();
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ Stripe payment intent creation completed!");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Stripe call performance:", {
      callDuration: (stripeCallEndTime - stripeCallStartTime) + 'ms',
      callDurationSeconds: ((stripeCallEndTime - stripeCallStartTime) / 1000).toFixed(2) + 's'
    });
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: Stripe response ultra-detailed analysis:", {
      responseExists: !!stripePaymentIntent,
      responseType: typeof stripePaymentIntent,
      responseConstructor: stripePaymentIntent?.constructor?.name,
      responseKeys: Object.keys(stripePaymentIntent || {}),
      hasClientSecret: !!stripePaymentIntent?.clientSecret,
      clientSecretType: typeof stripePaymentIntent?.clientSecret,
      clientSecretLength: stripePaymentIntent?.clientSecret?.length || 0,
      clientSecretPreview: stripePaymentIntent?.clientSecret?.substring(0, 20) + '...',
      hasPaymentIntentId: !!stripePaymentIntent?.paymentIntentId,
      paymentIntentIdType: typeof stripePaymentIntent?.paymentIntentId,
      paymentIntentIdLength: stripePaymentIntent?.paymentIntentId?.length || 0,
      paymentIntentIdPreview: stripePaymentIntent?.paymentIntentId?.substring(0, 20) + '...'
    });
    console.log("🚀 PAYMENT_INTENT_HANDLER: Complete Stripe response JSON:", JSON.stringify(stripePaymentIntent, null, 2));

    logger.setContext({ paymentIntentId: stripePaymentIntent.paymentIntentId });
    logger.info("Payment intent created successfully");

    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ PREPARING FINAL RESPONSE ================");
    const response = {
      clientSecret: stripePaymentIntent.clientSecret,
      paymentIntentId: stripePaymentIntent.paymentIntentId,
      calculatedAmount: totalAmount,
      details: {
        nights: numberOfNights,
        roomCount: rooms.length
      }
    };
    
    console.log("🚀 PAYMENT_INTENT_HANDLER: Final response ultra-detailed preparation:");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Response structure analysis:", {
      hasClientSecret: !!response.clientSecret,
      clientSecretValid: typeof response.clientSecret === 'string' && response.clientSecret.length > 0,
      hasPaymentIntentId: !!response.paymentIntentId,
      paymentIntentIdValid: typeof response.paymentIntentId === 'string' && response.paymentIntentId.length > 0,
      hasCalculatedAmount: !!response.calculatedAmount,
      calculatedAmountValid: typeof response.calculatedAmount === 'number' && response.calculatedAmount > 0,
      hasDetails: !!response.details,
      detailsValid: typeof response.details === 'object' && response.details !== null
    });
    console.log("🚀 PAYMENT_INTENT_HANDLER: Complete final response JSON:", JSON.stringify(response, null, 2));
    console.log("🚀 PAYMENT_INTENT_HANDLER: Response size (bytes):", JSON.stringify(response).length);
    
    const totalExecutionTime = Date.now() - nightsCalcStartTime;
    console.log("🚀 PAYMENT_INTENT_HANDLER: ✅ SUCCESS! Function execution completed!");
    console.log("🚀 PAYMENT_INTENT_HANDLER: Performance summary:", {
      totalExecutionTime: totalExecutionTime + 'ms',
      totalExecutionSeconds: (totalExecutionTime / 1000).toFixed(2) + 's',
      nightsCalculationTime: (nightsCalcEndTime - nightsCalcStartTime) + 'ms',
      priceCalculationTime: (priceCalcEndTime - priceCalcStartTime) + 'ms',
      stripeCallTime: (stripeCallEndTime - stripeCallStartTime) + 'ms'
    });
    console.log("🚀 PAYMENT_INTENT_HANDLER: Final memory usage:", process.memoryUsage());
    console.log("🚀 PAYMENT_INTENT_HANDLER: ================ FUNCTION EXECUTION COMPLETED SUCCESSFULLY ================");
    
    return response;

  } catch (error: any) {
    console.error("🚀 PAYMENT_INTENT_HANDLER: ❌❌❌ ULTRA CRITICAL ERROR OCCURRED! ❌❌❌");
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error timestamp:", new Date().toISOString());
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error in function execution context");
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error ultra-comprehensive analysis:", {
      errorExists: !!error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorPrototype: Object.getPrototypeOf(error || {})?.constructor?.name,
      errorString: String(error),
      errorToString: error?.toString?.(),
      errorValueOf: error?.valueOf?.(),
      instanceChecks: {
        Error: error instanceof Error,
        HttpsError: error instanceof HttpsError,
        TypeError: error instanceof TypeError,
        ReferenceError: error instanceof ReferenceError,
        SyntaxError: error instanceof SyntaxError
      }
    });
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error properties ultra-detailed:", {
      name: {
        value: error?.name,
        type: typeof error?.name
      },
      message: {
        value: error?.message,
        type: typeof error?.message,
        length: error?.message?.length || 0
      },
      code: {
        value: error?.code,
        type: typeof error?.code
      },
      details: {
        value: error?.details,
        type: typeof error?.details,
        keys: error?.details ? Object.keys(error.details) : []
      },
      stack: {
        hasStack: !!error?.stack,
        type: typeof error?.stack,
        length: error?.stack?.length || 0,
        preview: error?.stack?.substring(0, 500) + '...'
      }
    });
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: Error enumeration and serialization:");
    try {
      console.error("🚀 PAYMENT_INTENT_HANDLER: Object.keys():", Object.keys(error || {}));
      console.error("🚀 PAYMENT_INTENT_HANDLER: Object.getOwnPropertyNames():", Object.getOwnPropertyNames(error || {}));
      console.error("🚀 PAYMENT_INTENT_HANDLER: JSON.stringify():", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (serializationError) {
      console.error("🚀 PAYMENT_INTENT_HANDLER: Error serialization failed:", serializationError);
    }
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: Full error object:", error);
    console.error("🚀 PAYMENT_INTENT_HANDLER: Request data that caused error:", JSON.stringify(request?.data, null, 2));
    console.error("🚀 PAYMENT_INTENT_HANDLER: Current memory usage:", process.memoryUsage());
    console.error("🚀 PAYMENT_INTENT_HANDLER: Current environment:", {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime() + 's'
    });
    
    logger.error("!!! UNHANDLED EXCEPTION IN createPaymentIntentHandler !!!", {
      errorMessage: error.message,
      errorCode: error.code,
      errorType: error.constructor.name,
      stack: error.stack,
      requestData: request.data,
      errorDetails: error.details || null,
      stripeErrorType: error.type || null,
      httpErrorCode: error.httpErrorCode || null,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage()
    });
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: About to process and re-throw error...");
    
    if (error instanceof HttpsError) {
      console.error("🚀 PAYMENT_INTENT_HANDLER: Error is already HttpsError, re-throwing as-is");
      console.error("🚀 PAYMENT_INTENT_HANDLER: HttpsError details:", {
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw error;
    }
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: Converting error to HttpsError");
    const httpsError = new HttpsError('internal', 'An unexpected error occurred while creating the payment intent.', {
      originalMessage: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      requestDataPreview: JSON.stringify(request?.data, null, 2)?.substring(0, 500) + '...'
    });
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: Created HttpsError:", {
      code: httpsError.code,
      message: httpsError.message,
      details: httpsError.details
    });
    
    console.error("🚀 PAYMENT_INTENT_HANDLER: ================ ERROR PROCESSING COMPLETED, THROWING ================");
    throw httpsError;
  }
};

export const createPaymentIntent = onCall(createPaymentIntentHandler);
