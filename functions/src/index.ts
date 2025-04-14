
import * as admin from "firebase-admin";
import { createPaymentIntent } from "./payment/createPaymentIntent";
import { processBooking } from "./payment/processBooking";
// import { stripeWebhook } from "./webhooks/stripeWebhook";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all the functions
export {
  createPaymentIntent,
  processBooking,
  // Uncomment to enable the webhook handler
  // stripeWebhook,
};
