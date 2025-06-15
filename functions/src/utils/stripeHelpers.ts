import { getStripeClient } from "../config/stripe";
import { logger } from "./logger";
import * as functions from "firebase-functions";

/**
 * Enhanced Stripe error handling with user-friendly messages
 */
export const handleStripeError = (error: any, context: string = 'Stripe operation') => {
  logger.error(`${context} failed`, error);

  // Map Stripe error types to user-friendly messages
  const errorMessages: Record<string, string> = {
    'StripeCardError': 'Your card was declined. Please try a different payment method.',
    'StripeInvalidRequestError': 'Invalid payment information. Please check your details and try again.',
    'StripeAPIError': 'Payment service temporarily unavailable. Please try again in a moment.',
    'StripeConnectionError': 'Network error. Please check your connection and try again.',
    'StripeAuthenticationError': 'Payment service configuration error. Please contact support.',
    'StripeRateLimitError': 'Too many payment attempts. Please wait a moment and try again.',
    'StripePermissionError': 'Payment service permission error. Please contact support.',
    'StripeIdempotencyError': 'Duplicate payment request detected. Please refresh and try again.',
  };

  const userMessage = errorMessages[error.type] || 'Payment processing failed. Please try again.';

  // Determine appropriate HTTP error code
  let httpErrorCode: functions.https.FunctionsErrorCode = 'internal';
  
  switch (error.type) {
    case 'StripeCardError':
    case 'StripeInvalidRequestError':
      httpErrorCode = 'invalid-argument';
      break;
    case 'StripeRateLimitError':
      httpErrorCode = 'resource-exhausted';
      break;
    case 'StripeAuthenticationError':
    case 'StripePermissionError':
      httpErrorCode = 'unauthenticated';
      break;
    case 'StripeIdempotencyError':
      httpErrorCode = 'already-exists';
      break;
    default:
      httpErrorCode = 'internal';
  }

  throw new functions.https.HttpsError(
    httpErrorCode,
    userMessage,
    {
      type: 'stripe_error',
      stripeErrorType: error.type,
      stripeCode: error.code,
      declineCode: error.decline_code,
      requestId: error.requestId,
      context
    }
  );
};

/**
 * Generate idempotency key for Stripe operations
 */
export const generateIdempotencyKey = (operation: string, identifier: string): string => {
  return `${operation}_${identifier}_${Date.now()}`;
};

/**
 * Validate amount is within Stripe limits
 */
export const validateStripeAmount = (amount: number, currency: string = 'usd'): void => {
  const amountInCents = Math.round(amount * 100);
  
  // Stripe minimum amounts by currency (in cents)
  const minimumAmounts: Record<string, number> = {
    'usd': 50,  // $0.50
    'eur': 50,  // €0.50
    'gbp': 30,  // £0.30
    // Add more currencies as needed
  };

  const minimum = minimumAmounts[currency.toLowerCase()] || 50;
  
  if (amountInCents < minimum) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Payment amount too small. Minimum is ${minimum / 100} ${currency.toUpperCase()}.`,
      { type: 'validation_error', field: 'amount', minimum, actual: amountInCents }
    );
  }

  // Stripe maximum amount (varies by currency, this is a safe general limit)
  const maximum = 9999999; // $99,999.99
  
  if (amountInCents > maximum) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Payment amount too large. Maximum is ${maximum / 100} ${currency.toUpperCase()}.`,
      { type: 'validation_error', field: 'amount', maximum, actual: amountInCents }
    );
  }
};

/**
 * Safely retrieve and validate Stripe customer
 */
export const getOrCreateStripeCustomer = async (email: string, name?: string): Promise<string> => {
  try {
    const stripe = getStripeClient();
    logger.info("Searching for existing Stripe customer", { email });
    
    // Search for existing customer
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      const customerId = existingCustomers.data[0].id;
      logger.info("Found existing Stripe customer", { customerId, email });
      return customerId;
    }

    // Create new customer
    logger.info("Creating new Stripe customer", { email, name });
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        created_via: 'firebase_function',
        created_at: new Date().toISOString()
      }
    });

    logger.info("Created new Stripe customer", { customerId: customer.id, email });
    return customer.id;
    
  } catch (error: any) {
    handleStripeError(error, 'Customer creation/retrieval');
    throw error; // This won't be reached due to handleStripeError throwing
  }
};