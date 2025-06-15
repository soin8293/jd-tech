
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { APIError, PaymentResponse } from "@/components/payment/payment.types";

export const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
export const processBookingFunction = httpsCallable(functions, 'processBooking');

export const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const handlePaymentError = (error: any): APIError => {
  console.error("💳 PAYMENT ERROR: ============= DETAILED ERROR ANALYSIS =============");
  console.error("💳 PAYMENT ERROR: Error timestamp:", new Date().toISOString());
  console.error("💳 PAYMENT ERROR: Error type:", typeof error);
  console.error("💳 PAYMENT ERROR: Error constructor:", error?.constructor?.name);
  console.error("💳 PAYMENT ERROR: Error message:", error?.message);
  console.error("💳 PAYMENT ERROR: Error code:", error?.code);
  console.error("💳 PAYMENT ERROR: Error details:", error?.details);
  console.error("💳 PAYMENT ERROR: Error cause:", error?.cause);
  console.error("💳 PAYMENT ERROR: Error stack:", error?.stack);
  console.error("💳 PAYMENT ERROR: Full error object:", error);
  console.error("💳 PAYMENT ERROR: Error serialized:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
  
  // Log Firebase-specific error details if present
  if (error?.details) {
    console.error("💳 PAYMENT ERROR: Firebase function error details:", error.details);
  }
  if (error?.code) {
    console.error("💳 PAYMENT ERROR: Firebase error code:", error.code);
  }
  
  // Check if this is a functions deployment issue
  if (error?.code === 'functions/internal') {
    console.error("💳 PAYMENT ERROR: This is likely a Firebase Functions deployment issue!");
    console.error("💳 PAYMENT ERROR: Check if functions are deployed and accessible");
  }
  
  // Log network-related info
  console.error("💳 PAYMENT ERROR: Current URL:", window.location.href);
  console.error("💳 PAYMENT ERROR: Firebase project config:", {
    projectId: functions.app.options.projectId,
    authDomain: functions.app.options.authDomain
  });
  
  const apiError: APIError = {
    type: error.details?.type || error.code || 'unknown',
    message: error.message || "Failed to process payment"
  };
  
  console.error("💳 PAYMENT ERROR: Processed API error:", apiError);
  console.error("💳 PAYMENT ERROR: ============= END ERROR ANALYSIS =============");
  
  toast({
    title: "Payment Error",
    description: error.message || "There was a problem with your payment",
    variant: "destructive",
  });
  
  return apiError;
};

export const saveBookingToLocalStorage = (bookingId: string, bookingToken: string | undefined): void => {
  console.log("💾 STORAGE: Saving booking to localStorage", { bookingId, hasToken: !!bookingToken });
  if (bookingId) {
    localStorage.setItem('lastBookingId', bookingId);
    if (bookingToken) {
      localStorage.setItem('lastBookingToken', bookingToken);
    }
  }
};
