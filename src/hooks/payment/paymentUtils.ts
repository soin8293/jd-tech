
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
  console.error("FRONTEND: Error in payment process:", error);
  console.error("FRONTEND: Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
  
  const apiError: APIError = {
    type: error.details?.type || error.code || 'unknown',
    message: error.message || "Failed to process payment"
  };
  
  toast({
    title: "Payment Error",
    description: error.message || "There was a problem with your payment",
    variant: "destructive",
  });
  
  return apiError;
};

export const saveBookingToLocalStorage = (bookingId: string, bookingToken: string | undefined): void => {
  if (bookingId) {
    localStorage.setItem('lastBookingId', bookingId);
    if (bookingToken) {
      localStorage.setItem('lastBookingToken', bookingToken);
    }
  }
};
