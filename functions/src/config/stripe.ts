
import * as functions from "firebase-functions";
import Stripe from "stripe";

// Define a fallback secret key for development (ONLY USE TEST KEYS HERE)
const STRIPE_SECRET_KEY = "sk_test_51QyqmqPpAASNRvfwC8UXu3gWJZXZux89ypB5gApsS3pQs83b3zXFSfO9tdH2yAQL2raGYdTi50M58EDyTsYsD1r800hUbJFY0U";

// Try to get the key from environment variables first, then fall back to the hardcoded test key
const getStripeSecretKey = () => {
  try {
    const configKey = functions.config().stripe?.secret_key;
    if (configKey) {
      console.log("Using Stripe secret key from Firebase config");
      return configKey;
    }
    console.log("Firebase config Stripe key not found, using fallback test key");
    return STRIPE_SECRET_KEY;
  } catch (error) {
    console.warn("Error accessing Firebase config, using fallback test key:", error);
    return STRIPE_SECRET_KEY;
  }
};

// Initialize Stripe with Secret Key
export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: "2023-08-16", // Using specific API version as recommended
});

// Log Stripe initialization (without exposing the full key)
const keyPrefix = getStripeSecretKey().substring(0, 8);
console.log(`Stripe initialized with key prefix: ${keyPrefix}...`);
