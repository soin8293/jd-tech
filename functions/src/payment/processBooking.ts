
import * as functions from "firebase-functions";
import { stripe } from "../config/stripe";
import { ProcessBookingData, PaymentResponse } from "../types/booking.process.types";
import { updateRoomsAfterBooking } from "../utils/bookingRoomUpdater";
import { storeBookingData } from "../utils/bookingDataStore";

export const processBooking = functions.https.onCall(
  async (data: ProcessBookingData, context: functions.https.CallableContext): Promise<PaymentResponse> => {
    try {
      console.log("Processing booking with data:", JSON.stringify({
        paymentIntentId: data.paymentIntentId,
        paymentType: data.paymentType,
        transaction_id: data.transaction_id,
        userEmail: data.userEmail || 'not provided',
        timestamp: data.timestamp,
        rooms: data.bookingDetails?.rooms?.length || 0,
      }, null, 2));
      
      const { paymentIntentId } = data;
      
      if (!paymentIntentId) {
        console.error("Missing paymentIntentId in processBooking request");
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Payment Intent ID is required to verify payment status",
          { type: 'validation_error' }
        );
      }
      
      // Verify payment status with Stripe
      console.log(`Verifying payment status for Payment Intent: ${paymentIntentId}`);
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log("Payment Intent retrieved successfully:", JSON.stringify({
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: new Date(paymentIntent.created * 1000).toISOString(),
          customer: paymentIntent.customer
        }, null, 2));
        
        // Log the full payment intent object for detailed debugging
        console.log("Full Payment Intent object:", JSON.stringify(paymentIntent, null, 2));
      } catch (stripeError: any) {
        console.error("Error retrieving payment intent from Stripe:", {
          message: stripeError.message,
          code: stripeError.code,
          type: stripeError.type,
          stack: stripeError.stack,
          paymentIntentId
        });
        console.error("Stripe error details:", JSON.stringify(stripeError, null, 2));
        
        throw new functions.https.HttpsError(
          "unavailable",
          "Could not verify payment status with Stripe. Please try again later.",
          { type: 'network_error' }
        );
      }
      
      // Check if payment is successful
      if (paymentIntent.status !== 'succeeded') {
        console.error(`Payment verification failed. Status: ${paymentIntent.status}`, {
          paymentIntentId,
          currentStatus: paymentIntent.status,
          transaction_id: data.transaction_id
        });
        throw new functions.https.HttpsError(
          "failed-precondition", 
          `Payment not completed successfully. Current status: ${paymentIntent.status}`,
          { type: 'payment_failed' }
        );
      }
      
      console.log(`Payment verified successfully. Status: ${paymentIntent.status}`);
      
      // Generate booking ID
      const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      try {
        // Store booking in Firestore
        await storeBookingData(bookingId, paymentIntent, data);
        
        // Update room availability
        await updateRoomsAfterBooking(bookingId, data.bookingDetails);
        
        // Return success response
        console.log(`Booking processed successfully. Booking ID: ${bookingId}`);
        return {
          success: true,
          bookingId: bookingId,
          paymentStatus: paymentIntent.status,
          message: "Booking confirmed successfully!"
        };
        
      } catch (error: any) {
        // Payment was successful, but we couldn't store the booking
        console.error("Error in booking process:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
          bookingId,
          paymentIntentId,
          transaction_id: data.transaction_id
        });
        
        return {
          success: true,
          partial: true,
          bookingId: bookingId,
          paymentStatus: paymentIntent.status,
          message: "Payment successful, but booking details could not be saved. Please contact support with your transaction ID."
        };
      }
      
    } catch (error: any) {
      console.error("Error processing booking:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        type: error.details?.type || 'unknown',
        stack: error.stack,
        transaction_id: data?.transaction_id || 'unknown',
        paymentIntentId: data?.paymentIntentId || 'unknown'
      });
      
      return {
        success: false,
        error: {
          type: error.details?.type || 'unknown',
          message: error.message || "Failed to process booking. Please try again."
        }
      };
    }
  }
);
