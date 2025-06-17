
import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { CreatePaymentIntentResponse } from "../types/booking.types";
import { validateRequest, schemas } from "../utils/validation";
import { PaymentLogger } from "../utils/paymentLogging";
import { PaymentIntentProcessor } from "./paymentIntentProcessor";

const createPaymentIntentHandler = async (request: any): Promise<CreatePaymentIntentResponse> => {
  const paymentLogger = new PaymentLogger("PAYMENT_INTENT_HANDLER");
  const processor = new PaymentIntentProcessor();

  try {
    // Log request analysis
    paymentLogger.logRequestAnalysis(request, "PAYMENT_INTENT_HANDLER");
    
    // Validate request
    paymentLogger.logValidationStart("PAYMENT_INTENT_HANDLER");
    const validatedData = validateRequest(schemas.createPaymentIntent, request.data);
    paymentLogger.logValidationSuccess(validatedData, "PAYMENT_INTENT_HANDLER");
    
    // Process payment intent
    const response = await processor.processPaymentIntent(validatedData);
    
    // Log success
    paymentLogger.logSuccess(response, "PAYMENT_INTENT_HANDLER");
    
    return response;

  } catch (error: any) {
    // Log only serializable properties to avoid circular structure error
    console.error("🚀 PAYMENT_INTENT_HANDLER: ❌ Error occurred:", {
      message: error.message,
      code: error.code,
      type: error.type,
      name: error.name,
      stack: error.stack?.substring(0, 500) // Truncate stack trace
    });
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'An unexpected error occurred while creating the payment intent.', {
      errorMessage: error.message || 'Unknown error',
      errorCode: error.code || 'unknown',
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    });
  }
};

export const createPaymentIntent = onCall({
  cors: [
    "https://jd-suites-backend.web.app",
    "https://jd-suites-backend.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com"
  ]
}, createPaymentIntentHandler);
