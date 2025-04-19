
import * as functions from "firebase-functions";
import Stripe from "stripe";

// Initialize Stripe with Secret Key from environment variables
export const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-08-16", // Using specific API version as recommended
});
