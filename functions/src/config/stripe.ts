
import * as functions from "firebase-functions";

// Initialize Stripe with Secret Key from environment variables
export const stripe = require('stripe')(functions.config().stripe.secret_key);
