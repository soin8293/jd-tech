
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import { CreatePaymentIntentData, CreatePaymentIntentResponse } from "../types/booking.types";

const logEvent = (event: string, data?: any) => {
  console.log(`[CREATE-PAYMENT-INTENT] ${event}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`);
};

export const createPaymentIntent = functions.https.onCall(
  async (data: CreatePaymentIntentData, context: functions.https.CallableContext): Promise<CreatePaymentIntentResponse> => {
    try {
      // Log the entire input data for debugging
      logEvent("Function started with full input data", data);

      // Extract booking details from request
      const { rooms, period, guests, transaction_id, booking_reference } = data;
      const currency = data.currency || "usd";
      
      logEvent("Extracted booking details", { 
        roomCount: rooms?.length, 
        period, 
        guests, 
        transaction_id, 
        currency 
      });

      // Detailed input validation with extensive logging
      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        logEvent("VALIDATION ERROR: Invalid rooms data", { rooms });
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "No rooms provided for booking.",
          { type: "validation_error", field: "rooms" }
        );
      }

      if (!period || !period.checkIn || !period.checkOut) {
        logEvent("VALIDATION ERROR: Invalid period data", { period });
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Invalid booking period.",
          { type: "validation_error", field: "period" }
        );
      }

      logEvent("Input validation passed");
      
      // Initialize Firebase Admin if needed
      if (!admin.apps.length) {
        logEvent("Initializing Firebase Admin");
        admin.initializeApp();
      }

      // Calculate number of nights and room prices with additional logging
      logEvent("Calling calculateNumberOfNights...");
      const numberOfNights = calculateNumberOfNights(period);
      logEvent("Number of nights calculated", { numberOfNights });
      
      if (numberOfNights <= 0) {
        logEvent("VALIDATION ERROR: Invalid booking period - negative or zero nights", { period, numberOfNights });
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Check-in must be before check-out date.",
          { type: "validation_error", field: "period" }
        );
      }
      
      // Log rooms and nights before price calculation
      logEvent("Rooms and Nights Details", { 
        rooms: rooms.map(r => ({ id: r.id, name: r.name, price: r.price })), 
        numberOfNights 
      });
      
      logEvent("Calling calculateRoomPrices...");
      const { totalAmount, roomPrices } = await calculateRoomPrices(rooms, numberOfNights);
      
      logEvent("Room prices calculation completed", { 
        numberOfNights, 
        totalAmount, 
        roomPrices,
        calculationMethod: 'multiplying room prices by nights' 
      });

      // Create Stripe Payment Intent with extensive logging
      logEvent("Preparing to create Stripe payment intent");
      const stripeParams = {
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
      };
      
      logEvent("Calling createStripePaymentIntent with params", stripeParams);
      
      const stripePaymentIntent = await createStripePaymentIntent(stripeParams);
      
      logEvent("Payment intent created successfully", { 
        paymentIntentId: stripePaymentIntent.paymentIntentId,
        hasClientSecret: !!stripePaymentIntent.clientSecret 
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
      // Comprehensive error logging
      console.error('FULL ERROR in createPaymentIntent:', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorStack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      
      // If the error is already an HttpsError, pass it through
      if (error instanceof functions.https.HttpsError) {
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
            errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
          } 
        }
      );
    }
  }
);
