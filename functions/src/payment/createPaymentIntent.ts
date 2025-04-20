
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { calculateNumberOfNights, calculateRoomPrices } from "../utils/roomPriceCalculator";
import { createStripePaymentIntent } from "../utils/stripePaymentCreator";
import { CreatePaymentIntentData, CreatePaymentIntentResponse } from "../types/booking.types";

export const createPaymentIntent = functions.https.onCall(
  async (data: CreatePaymentIntentData, context: functions.https.CallableContext): Promise<CreatePaymentIntentResponse> => {
    try {
      console.log("Creating payment intent with data:", JSON.stringify(data, null, 2));

      // Extract booking details from request
      const { rooms, period, guests, transaction_id, booking_reference } = data;
      const currency = data.currency || "usd";

      // Input Validation
      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "No rooms provided for booking.");
      }

      if (!period || !period.checkIn || !period.checkOut) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid booking period.");
      }

      // Initialize Firebase Admin if needed
      if (!admin.apps.length) {
        admin.initializeApp();
      }

      // Calculate number of nights and room prices
      const numberOfNights = calculateNumberOfNights(period);
      const { totalAmount, roomPrices } = await calculateRoomPrices(rooms, numberOfNights);

      console.log(`Booking calculation completed:`, {
        numberOfNights,
        totalAmount,
        roomPrices
      });

      // Create Stripe Payment Intent
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
      console.error('Error in createPaymentIntent:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create payment intent',
        { type: 'unknown_error', details: { error: error.message } }
      );
    }
  }
);
