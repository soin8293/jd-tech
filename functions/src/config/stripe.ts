
import * as functions from "firebase-functions";
import Stripe from "stripe";

// Define a fallback secret key for development (ONLY USE TEST KEYS HERE)
const STRIPE_SECRET_KEY = "sk_test_51QyqmqPpAASNRvfwC8UXu3gWJZXZux89ypB5gApsS3pQs83b3zXFSfO9tdH2yAQL2raGYdTi50M58EDyTsYsD1r800hUbJFY0U";

// 1. Declare a variable to hold the Stripe instance, but leave it uninitialized.
let stripeSingleton: Stripe | null = null;

/**
 * A "singleton" getter function for the Stripe client.
 * It initializes the client only on the first call and then
 * returns the same instance on all subsequent calls.
 *
 * @returns {Stripe} The initialized Stripe client instance.
 */
export const getStripeClient = (): Stripe => {
  // 2. If the singleton hasn't been initialized yet, create it.
  if (!stripeSingleton) {
    try {
      console.log("STRIPE_CONFIG: Attempting to get Stripe secret key from Firebase config");
      const configKey = functions.config().stripe?.secret_key;
      
      let secretKey: string;
      if (configKey) {
        console.log("STRIPE_CONFIG: Found Stripe secret key in Firebase config");
        secretKey = configKey;
      } else {
        console.log("STRIPE_CONFIG: Firebase config Stripe key not found, using fallback test key");
        secretKey = STRIPE_SECRET_KEY;
      }
      
      console.log(`STRIPE_CONFIG: Initializing Stripe with key prefix: ${secretKey.substring(0, 8)}...`);
      
      stripeSingleton = new Stripe(secretKey, {
        apiVersion: "2024-04-10", // Updated to the supported API version
      });
      
      console.log("STRIPE_CONFIG: Stripe initialized successfully with API version 2024-04-10");
    } catch (error) {
      console.error("STRIPE_CONFIG: Error accessing Firebase config, using fallback test key:", error);
      stripeSingleton = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: "2024-04-10",
      });
    }
  }
  // 3. Return the instance.
  return stripeSingleton;
};
