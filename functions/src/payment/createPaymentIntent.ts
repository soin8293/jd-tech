
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import { CreatePaymentIntentData, CreatePaymentIntentResponse } from "../types/booking.types";

// Enable CORS for all origins (dev). Restrict this before going to production!
const corsHandler = cors({ origin: true });

const logEvent = (event: string, data?: any) => {
  console.log(`[CREATE-PAYMENT-INTENT] ${event}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`);
};

// Note: 'onCall' functions don't expose req/res directly, but we can enable CORS globally via options requests and callable triggers
export const createPaymentIntent = functions.https.onCall(
  async (data: CreatePaymentIntentData, context: functions.https.CallableContext): Promise<CreatePaymentIntentResponse> => {
    return new Promise((resolve, reject) => {
      // Simulate the CORS middleware pattern to attach CORS headers (mainly for local testing & web deployments)
      corsHandler(context.rawRequest, context.rawResponse, async () => {
        try {
          logEvent("Function started with full input data", data);
          const { rooms, period, guests, transaction_id, booking_reference } = data;
          const currency = data.currency || "usd";
      
          logEvent("Extracted booking details", { 
            roomCount: rooms?.length, 
            period, 
            guests, 
            transaction_id, 
            currency 
          });

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
          
          if (!admin.apps.length) {
            logEvent("Initializing Firebase Admin");
            admin.initializeApp();
          }

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

          resolve({
            clientSecret: stripePaymentIntent.clientSecret,
            paymentIntentId: stripePaymentIntent.paymentIntentId,
            calculatedAmount: totalAmount,
            details: {
              nights: numberOfNights,
              roomCount: rooms.length
            }
          });
        } catch (error: any) {
          // Enhanced error logging for CORS
          console.error('FULL ERROR in createPaymentIntent:', {
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorStack: error.stack,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
          });

          if (error instanceof functions.https.HttpsError) {
            console.error('Forwarding HttpsError:', {
              code: error.code,
              message: error.message,
              details: error.details
            });
            reject(error);
            return;
          }

          reject(new functions.https.HttpsError(
            'internal',
            error.message || 'Failed to create payment intent',
            { 
              type: 'unknown_error', 
              details: { 
                error: error.message,
                errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
              } 
            }
          ));
        }
      });
    });
  }
);
