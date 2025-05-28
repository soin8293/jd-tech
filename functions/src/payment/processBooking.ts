
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { stripe } from "../config/stripe";
import { ProcessBookingData, PaymentResponse } from "../types/booking.process.types";
import { storeBookingData } from "../utils/bookingDataStore";

export const processBooking = onCall(
  async (request): Promise<PaymentResponse> => {
    try {
      console.log("Processing booking with data:", JSON.stringify({
        paymentIntentId: request.data.paymentIntentId,
        paymentType: request.data.paymentType,
        transaction_id: request.data.transaction_id,
        userEmail: request.data.userEmail || 'not provided',
        timestamp: request.data.timestamp,
        rooms: request.data.bookingDetails?.rooms?.length || 0,
      }, null, 2));
      
      const { paymentIntentId } = request.data as ProcessBookingData;
      
      if (!paymentIntentId) {
        console.error("Missing paymentIntentId in processBooking request");
        throw new HttpsError(
          "invalid-argument", 
          "Payment Intent ID is required to verify payment status",
          { type: 'validation_error' }
        );
      }
      
      if (!stripe) {
        console.error("Stripe instance not available in processBooking");
        throw new HttpsError(
          'internal',
          'Payment service unavailable',
          { type: 'configuration_error' }
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
        
        throw new HttpsError(
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
          transaction_id: request.data.transaction_id
        });
        throw new HttpsError(
          "failed-precondition", 
          `Payment not completed successfully. Current status: ${paymentIntent.status}`,
          { type: 'payment_failed' }
        );
      }
      
      console.log(`Payment verified successfully. Status: ${paymentIntent.status}`);
      
      // Generate booking ID
      const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      try {
        // Store booking in Firestore with transaction support
        await storeBookingData(bookingId, paymentIntent, request.data as ProcessBookingData);
        
        // Return success response with booking token for anonymous access
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
          transaction_id: request.data.transaction_id
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
        transaction_id: request.data?.transaction_id || 'unknown',
        paymentIntentId: request.data?.paymentIntentId || 'unknown'
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
