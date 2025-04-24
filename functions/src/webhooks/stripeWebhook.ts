
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { stripe } from "../config/stripe";

/**
 * Firebase Cloud Function for handling Stripe webhooks.
 * Uncomment and deploy if you want to handle payment events via webhooks.
 */
export const stripeWebhook = functions.https.onRequest(async (req, res): Promise<void> => {
  try {
    const webhookSecret = functions.config().stripe.webhook_secret;
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      console.error("Webhook Error: Missing stripe-signature header");
      res.status(400).send("Webhook Error: Missing signature");
      return;
    }
    
    if (!stripe) {
      console.error("Stripe instance not available in stripeWebhook.");
      res.status(500).send("Webhook Error: Payment service configuration error.");
      return;
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    // Handle specific events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update booking status if needed
      const bookingRef = await admin.firestore()
        .collection('bookings')
        .where('paymentIntentId', '==', paymentIntent.id)
        .limit(1)
        .get();
        
      if (!bookingRef.empty) {
        const booking = bookingRef.docs[0];
        await booking.ref.update({ 
          status: 'confirmed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated booking ${booking.id} status to confirmed`);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
      
      // Update booking status to failed
      const bookingRef = await admin.firestore()
        .collection('bookings')
        .where('paymentIntentId', '==', paymentIntent.id)
        .limit(1)
        .get();
        
      if (!bookingRef.empty) {
        const booking = bookingRef.docs[0];
        await booking.ref.update({ 
          status: 'failed',
          failureReason: paymentIntent.last_payment_error?.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated booking ${booking.id} status to failed`);
      }
    }
    
    // Return a 200 response
    res.status(200).send({ received: true });
  } catch (error) {
    console.error("Unhandled error in stripeWebhook:", error);
    res.status(500).send("Internal server error");
  }
});
