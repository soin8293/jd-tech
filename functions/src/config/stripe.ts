
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
    console.log("STRIPE_CONFIG: Attempting to get Stripe secret key from environment variables");
    
    // Use the modern v2 method of accessing environment variables
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    let finalSecretKey: string;
    if (secretKey) {
      console.log("STRIPE_CONFIG: Found Stripe secret key in environment variables");
      finalSecretKey = secretKey;
    } else {
      console.log("STRIPE_CONFIG: Environment variable STRIPE_SECRET_KEY not found, using fallback test key");
      finalSecretKey = STRIPE_SECRET_KEY;
    }
    
    console.log(`STRIPE_CONFIG: Initializing Stripe with key prefix: ${finalSecretKey.substring(0, 8)}...`);
    
    stripeSingleton = new Stripe(finalSecretKey, {
      apiVersion: "2024-04-10", // Updated to the supported API version
    });
    
    console.log("STRIPE_CONFIG: Stripe initialized successfully with API version 2024-04-10");
  }
  // 3. Return the instance.
  return stripeSingleton;
};
