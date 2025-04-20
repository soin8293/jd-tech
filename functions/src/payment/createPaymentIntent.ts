import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import { CreatePaymentIntentData, CreatePaymentIntentResponse } from "../types/booking.types";

// Helper function for consistent logging
const logEvent = (event: string, data?: any) => {
  console.log(`[CREATE-PAYMENT-INTENT] ${event}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`);
};

export const createPaymentIntent = functions.https.onCall(
  async (data: CreatePaymentIntentData, context: functions.https.CallableContext): Promise<CreatePaymentIntentResponse> => {
    try {
      logEvent("Function started with data", data);

      // Extract booking details from request
      const { rooms, period, guests, transaction_id, booking_reference } = data;
      const currency = data.currency || "usd";

      // Input Validation
      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        logEvent("Invalid rooms data", { rooms });
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "No rooms provided for booking.",
          { type: "validation_error", field: "rooms" }
        );
      }

      if (!period || !period.checkIn || !period.checkOut) {
        logEvent("Invalid period data", { period });
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Invalid booking period.",
          { type: "validation_error", field: "period" }
        );
      }

      // Initialize Firebase Admin if needed
      if (!admin.apps.length) {
        logEvent("Initializing Firebase Admin");
        admin.initializeApp();
      }

      // Calculate number of nights and room prices
      logEvent("Calculating booking details");
      const numberOfNights = calculateNumberOfNights(period);
      if (numberOfNights <= 0) {
        logEvent("Invalid booking period - negative or zero nights", { period, numberOfNights });
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Check-in must be before check-out date.",
          { type: "validation_error", field: "period" }
        );
      }
      
      const { totalAmount, roomPrices } = await calculateRoomPrices(rooms, numberOfNights);
      logEvent("Booking calculation completed", { numberOfNights, totalAmount, roomPrices });

      // Create Stripe Payment Intent
      logEvent("Creating Stripe payment intent");
      const stripePaymentIntent = await createStripePaymentIntent({
        amount: totalAmount,
        currency,
        metadata: {
          booking_reference: booking_reference || '',
          transaction_id: transaction_id || '',
          nights: numberOfNights,
          rooms: rooms.length,
          guests: guests || 1,
          roomIds: rooms.map(room => room.id).join(',')
        }
      });
      
      logEvent("Payment intent created successfully", { 
        paymentIntentId: stripePaymentIntent.paymentIntentId 
      });

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
      // Log errors with detailed information
      console.error('Error in createPaymentIntent:', {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      // If the error is already an HttpsError (from our utility functions), just pass it through
      if (error instanceof functions.https.HttpsError) {
        // Add additional debugging info before throwing
        console.error('Forwarding HttpsError:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        throw error;
      }
      
      // Otherwise, create a generic error with as much detail as possible
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create payment intent',
        { 
          type: 'unknown_error', 
          details: { 
            error: error.message,
            errorObject: JSON.stringify(error)
          } 
        }
      );
    }
  }
);
