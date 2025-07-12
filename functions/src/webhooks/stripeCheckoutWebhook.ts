import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStripeClient } from "../config/stripe";
import { logger } from "../utils/logger";

const stripeCheckoutWebhookHandler = async (request: any, response: any) => {
  const db = getFirestore();
  const stripe = getStripeClient();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const sig = request.headers['stripe-signature'];
    
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } else {
      // For development/testing without webhook secret
      event = JSON.parse(request.body);
    }
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  logger.info('Stripe webhook received', { 
    type: event.type, 
    id: event.id 
  });

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        logger.info('Checkout session completed', { 
          sessionId: session.id,
          paymentStatus: session.payment_status,
          paymentIntent: session.payment_intent
        });

        // Get booking ID from metadata
        const bookingId = session.metadata?.bookingId;
        
        if (!bookingId) {
          logger.error('No booking ID found in session metadata', { sessionId: session.id });
          break;
        }

        // Update booking status
        const bookingRef = db.collection("bookings").doc(bookingId);
        const bookingDoc = await bookingRef.get();
        
        if (!bookingDoc.exists) {
          logger.error('Booking not found', { bookingId });
          break;
        }

        const updateData: any = {
          status: 'confirmed',
          paymentStatus: 'succeeded',
          stripeSessionId: session.id,
          paymentTimestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add payment intent ID if available
        if (session.payment_intent) {
          updateData.stripePaymentIntentId = session.payment_intent;
        }

        await bookingRef.update(updateData);
        
        logger.info('Booking updated after successful payment', { 
          bookingId, 
          sessionId: session.id,
          paymentIntent: session.payment_intent
        });

        // Optional: Send confirmation email
        // You could call sendBookingConfirmation function here

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        
        if (bookingId) {
          await db.collection("bookings").doc(bookingId).update({
            status: 'expired',
            paymentStatus: 'failed',
            updatedAt: new Date().toISOString(),
          });
          
          logger.info('Booking marked as expired', { bookingId, sessionId: session.id });
        }
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    response.json({ received: true });
  } catch (error: any) {
    logger.error('Error processing webhook', error);
    response.status(500).send('Webhook processing failed');
  }
};

export const stripeCheckoutWebhook = onRequest({
  cors: false, // Webhooks don't need CORS
}, stripeCheckoutWebhookHandler);