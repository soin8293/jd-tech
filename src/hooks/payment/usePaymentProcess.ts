
import { useState, useEffect } from "react";
import { PaymentStatus, APIError, PaymentResponse, ProcessBookingData, PaymentMethodType } from "@/components/payment/payment.types";
import { toast } from "@/hooks/use-toast";
import { PaymentProcessProps, UsePaymentProcessReturn } from "./paymentHooks.types";
import { usePaymentIntent } from "./usePaymentIntent";
import { processBookingFunction, handlePaymentError, saveBookingToLocalStorage } from "./paymentUtils";

export const usePaymentProcess = (
  isOpen: boolean,
  bookingDetails: BookingDetails | null,
  onPaymentComplete: () => void
): UsePaymentProcessReturn => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorDetails, setErrorDetails] = useState<APIError | null>(null);
  const [bookingId, setBookingId] = useState<string>('');
  const [bookingToken, setBookingToken] = useState<string>('');

  const { 
    clientSecret, 
    paymentIntentId, 
    transactionId, 
    calculatedAmount,
    isLoading, 
    error 
  } = usePaymentIntent(isOpen, bookingDetails);

  useEffect(() => {
    if (isOpen) {
      console.log("PAYMENT_PROCESS: Modal opened, resetting payment state");
      setPaymentStatus('idle');
      setErrorDetails(null);
      setBookingId('');
      setBookingToken('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isLoading) {
      setPaymentStatus('loading');
    } else if (error) {
      setPaymentStatus('error');
      setErrorDetails({
        type: error.details?.type || error.code || 'unknown',
        message: error.message || "Failed to initiate payment"
      });
    } else if (clientSecret && paymentStatus === 'loading') {
      setPaymentStatus('idle');
    }
  }, [isLoading, error, clientSecret, paymentStatus]);

  const processPayment = async (paymentType: PaymentMethodType, paymentMethodId: string) => {
    console.log("FRONTEND: Starting payment processing with method:", paymentType);
    
    if (!bookingDetails || !clientSecret || !paymentIntentId) {
      console.error("FRONTEND: Missing required payment information", {
        hasBookingDetails: !!bookingDetails,
        hasClientSecret: !!clientSecret,
        hasPaymentIntentId: !!paymentIntentId
      });
      
      setPaymentStatus('error');
      setErrorDetails({
        type: 'unknown',
        message: 'Missing required payment information'
      });
      return;
    }
    
    setPaymentStatus('processing');
    
    try {
      const bookingData: ProcessBookingData = {
        paymentMethodId,
        clientSecret,
        paymentIntentId,
        bookingDetails,
        paymentType,
        timestamp: new Date().toISOString(),
        transaction_id: transactionId,
        userEmail: localStorage.getItem('userEmail') || 'guest@example.com',
        serverCalculatedAmount: calculatedAmount
      };
      
      console.log("FRONTEND: Calling processBooking with data:", {
        ...bookingData,
        clientSecret: "present (masked for security)",
      });
      
      const result = await processBookingFunction(bookingData);
      const response = result.data as PaymentResponse;
      
      console.log("FRONTEND: Received processBooking response:", response);
      
      if (response.success) {
        setBookingId(response.bookingId || '');
        setBookingToken(response.bookingToken || '');
        setPaymentStatus('success');
        
        console.log("FRONTEND: Payment successful, booking created:", {
          bookingId: response.bookingId,
          hasToken: !!response.bookingToken
        });
        
        saveBookingToLocalStorage(response.bookingId || '', response.bookingToken);
        
        toast({
          title: "Payment Successful",
          description: response.message || "Your booking has been confirmed!",
        });
        
        setTimeout(() => {
          console.log("FRONTEND: Triggering onPaymentComplete callback");
          onPaymentComplete();
        }, 500);
      } else {
        setPaymentStatus('error');
        setErrorDetails(response.error || {
          type: 'unknown',
          message: 'Payment failed. Please try again.'
        });
        
        console.error("FRONTEND: Payment failed with error:", response.error);
        
        toast({
          title: "Payment Failed",
          description: response.error?.message || "There was a problem with your payment",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorDetails(handlePaymentError(error));
    }
  };

  return {
    paymentStatus,
    errorDetails,
    transactionId,
    bookingId,
    bookingToken,
    processPayment,
    calculatedAmount,
  };
};

// Import BookingDetails at the top level for TypeScript
import { BookingDetails } from "@/types/hotel.types";
