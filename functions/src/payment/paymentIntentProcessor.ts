
import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import type { CreatePaymentIntentResponse } from "../types/booking.types";
import { logger } from "../utils/logger";
import { PaymentLogger } from "../utils/paymentLogging";

export class PaymentIntentProcessor {
  private paymentLogger: PaymentLogger;

  constructor() {
    this.paymentLogger = new PaymentLogger("PAYMENT_INTENT_PROCESSOR");
  }

  async processPaymentIntent(validatedData: any): Promise<CreatePaymentIntentResponse> {
    const { rooms, period, guests, transaction_id, booking_reference, currency } = validatedData;
    
    logger.setContext({ 
      transaction_id,
      bookingReference: booking_reference,
      roomCount: rooms.length,
      guests 
    });

    // Initialize Firebase Admin if needed
    this.initializeFirebaseAdmin();

    logger.info("Processing payment intent creation", { 
      roomCount: rooms.length, 
      period, 
      guests, 
      currency 
    });

    // Calculate number of nights
    const numberOfNights = this.calculateAndValidateNights(period);
    logger.info("Booking duration calculated", { numberOfNights });

    // Calculate room prices
    const { totalAmount, roomPrices } = await this.calculateRoomPricing(rooms, numberOfNights);
    logger.info("Pricing calculation completed", { 
      numberOfNights, 
      totalAmount, 
      roomPrices
    });

    // Create Stripe payment intent
    const stripePaymentIntent = await this.createStripePayment(
      totalAmount, 
      currency, 
      transaction_id, 
      booking_reference, 
      numberOfNights, 
      rooms, 
      guests
    );

    logger.setContext({ paymentIntentId: stripePaymentIntent.paymentIntentId });
    logger.info("Payment intent created successfully");

    return this.buildResponse(stripePaymentIntent, totalAmount, numberOfNights, rooms);
  }

  private initializeFirebaseAdmin() {
    this.paymentLogger.logCalculationPhase("FIREBASE ADMIN INITIALIZATION", {}, "PAYMENT_INTENT_PROCESSOR");
    
    if (!admin.apps.length) {
      admin.initializeApp();
      console.log("🚀 PAYMENT_INTENT_PROCESSOR: ✅ Firebase Admin SDK initialized successfully!");
    } else {
      console.log("🚀 PAYMENT_INTENT_PROCESSOR: Firebase Admin SDK already initialized");
    }
  }

  private calculateAndValidateNights(period: any): number {
    this.paymentLogger.logCalculationPhase("CALCULATING NUMBER OF NIGHTS", { period }, "PAYMENT_INTENT_PROCESSOR");
    
    const numberOfNights = calculateNumberOfNights(period);
    
    if (numberOfNights <= 0) {
      console.error("🚀 PAYMENT_INTENT_PROCESSOR: ❌ CRITICAL ERROR: Invalid number of nights:", numberOfNights);
      throw new HttpsError(
        "invalid-argument", 
        "Check-in must be before check-out date.",
        { type: "validation_error", field: "period", numberOfNights }
      );
    }

    return numberOfNights;
  }

  private async calculateRoomPricing(rooms: any[], numberOfNights: number) {
    this.paymentLogger.logCalculationPhase("CALCULATING ROOM PRICES", { roomsCount: rooms.length, numberOfNights }, "PAYMENT_INTENT_PROCESSOR");
    
    const { totalAmount, roomPrices } = await calculateRoomPrices(rooms, numberOfNights);
    
    console.log("🚀 PAYMENT_INTENT_PROCESSOR: ✅ Room prices calculation completed!");
    console.log("🚀 PAYMENT_INTENT_PROCESSOR: Pricing results:", {
      totalAmount,
      totalAmountType: typeof totalAmount,
      isValidAmount: typeof totalAmount === 'number' && !isNaN(totalAmount) && totalAmount > 0,
      roomPricesLength: roomPrices?.length || 0
    });

    return { totalAmount, roomPrices };
  }

  private async createStripePayment(
    totalAmount: number, 
    currency: string, 
    transaction_id: string, 
    booking_reference: string, 
    numberOfNights: number, 
    rooms: any[], 
    guests: number
  ) {
    this.paymentLogger.logCalculationPhase("PREPARING STRIPE PAYMENT INTENT", {}, "PAYMENT_INTENT_PROCESSOR");
    
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
    
    console.log("🚀 PAYMENT_INTENT_PROCESSOR: ✅ Stripe payment intent creation completed!");
    
    return stripePaymentIntent;
  }

  private buildResponse(
    stripePaymentIntent: any, 
    totalAmount: number, 
    numberOfNights: number, 
    rooms: any[]
  ): CreatePaymentIntentResponse {
    const response = {
      clientSecret: stripePaymentIntent.clientSecret,
      paymentIntentId: stripePaymentIntent.paymentIntentId,
      calculatedAmount: totalAmount,
      details: {
        nights: numberOfNights,
        roomCount: rooms.length
      }
    };
    
    console.log("🚀 PAYMENT_INTENT_PROCESSOR: Final response prepared:", response);
    
    return response;
  }
}
