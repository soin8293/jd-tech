
import * as functions from "firebase-functions";
import Stripe from "stripe";

// Define a fallback secret key for development (ONLY USE TEST KEYS HERE)
const STRIPE_SECRET_KEY = "sk_test_51QyqmqPpAASNRvfwC8UXu3gWJZXZux89ypB5gApsS3pQs83b3zXFSfO9tdH2yAQL2raGYdTi50M58EDyTsYsD1r800hUbJFY0U";

// Lazy initialization - don't initialize at module load
let stripeInstance: Stripe | null = null;

// Lazy getter for Stripe secret key
const getStripeSecretKey = () => {
  try {
    console.log("STRIPE_CONFIG: Attempting to get Stripe secret key from Firebase config");
    const configKey = functions.config().stripe?.secret_key;
    
    if (configKey) {
      console.log("STRIPE_CONFIG: Found Stripe secret key in Firebase config");
      return configKey;
    }
    
    console.log("STRIPE_CONFIG: Firebase config Stripe key not found, using fallback test key");
    return STRIPE_SECRET_KEY;
  } catch (error) {
    console.warn("STRIPE_CONFIG: Error accessing Firebase config, using fallback test key:", error);
    return STRIPE_SECRET_KEY;
  }
};

// Lazy initialization function - only called when stripe is first accessed
const initializeStripe = () => {
  if (stripeInstance) {
    return stripeInstance;
  }

  try {
    const stripeKey = getStripeSecretKey();
    console.log(`STRIPE_CONFIG: Initializing Stripe with key prefix: ${stripeKey.substring(0, 8)}...`);
    
    stripeInstance = new Stripe(stripeKey, {
      apiVersion: "2023-08-16", // Using specific API version as recommended
    });
    
    console.log("STRIPE_CONFIG: Stripe initialized successfully with API version 2023-08-16");
    return stripeInstance;
  } catch (error) {
    console.error("STRIPE_CONFIG: Failed to initialize Stripe:", error);
    return null;
  }
};

// Export the Stripe instance with proper lazy initialization
export const stripe = (() => {
  let instance: Stripe | null = null;
  return () => {
    if (!instance) {
      instance = initializeStripe();
    }
    return instance;
  };
})();
