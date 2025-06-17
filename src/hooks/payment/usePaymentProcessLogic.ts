import { useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentMethodType } from "@/components/payment/payment.types";
import { toast } from "@/hooks/use-toast";
import { usePaymentState } from "./usePaymentState";
import { usePaymentIntentCreator } from "./usePaymentIntentCreator";
import { usePaymentProcessor } from "./usePaymentProcessor";

export const usePaymentProcessLogic = (
  isOpen: boolean,
  bookingDetails: BookingDetails | null,
  onPaymentComplete: () => void
) => {
  const {
    state,
    updatePaymentStatus,
    setError,
    setPaymentIntent,
    setBookingComplete,
    generateTransactionId,
    resetState,
  } = usePaymentState();

  const { createPaymentIntent } = usePaymentIntentCreator();
  const { processPayment: processPaymentRequest } = usePaymentProcessor();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("PAYMENT_PROCESS: Modal opened, resetting payment state");
      resetState();
    }
  }, [isOpen]);

  // Create payment intent when modal opens and we have booking details
  useEffect(() => {
    if (isOpen && bookingDetails) {
      updatePaymentStatus('loading');
      
      const transactionId = generateTransactionId();
      
      createPaymentIntent(bookingDetails, transactionId)
        .then((responseData) => {
          setPaymentIntent(
            responseData.paymentIntentId || '',
            responseData.calculatedAmount,
            responseData.clientSecret
          );
        })
        .catch((error: any) => {
          console.error("FRONTEND: Error calling createPaymentIntent function:", error);
          
          updatePaymentStatus('error');
          setError({
            type: error.details?.type || error.code || 'unknown',
            message: error.message || "Failed to initiate payment"
          });
          
          toast({
            title: "Payment Error",
            description: error.message || "Failed to initiate payment",
            variant: "destructive",
          });
        });
    }
  }, [isOpen, bookingDetails]);

  const processPayment = async (paymentType: PaymentMethodType, paymentMethodId: string) => {
    console.log("FRONTEND: Starting payment processing with method:", paymentType);
    
    if (!bookingDetails || !state.clientSecret || !state.paymentIntentId) {
      console.error("FRONTEND: Missing required payment information", {
        hasBookingDetails: !!bookingDetails,
        hasClientSecret: !!state.clientSecret,
        hasPaymentIntentId: !!state.paymentIntentId
      });
      
      updatePaymentStatus('error');
      setError({
        type: 'unknown',
        message: 'Missing required payment information'
      });
      return;
    }
    
    updatePaymentStatus('processing');
    
    try {
      const response = await processPaymentRequest(
        paymentMethodId,
        state.clientSecret,
        state.paymentIntentId,
        bookingDetails,
        paymentType,
        state.transactionId,
        state.calculatedAmount
      );
      
      if (response.success) {
        setBookingComplete(response.bookingId || '', response.bookingToken || '');
        
        console.log("FRONTEND: Payment successful, booking created:", {
          bookingId: response.bookingId,
          hasToken: !!response.bookingToken
        });
        
        if (response.bookingId) {
          localStorage.setItem('lastBookingId', response.bookingId);
          if (response.bookingToken) {
            localStorage.setItem('lastBookingToken', response.bookingToken);
          }
        }
        
        toast({
          title: "Payment Successful",
          description: response.message || "Your booking has been confirmed!",
        });
        
        setTimeout(() => {
          console.log("FRONTEND: Triggering onPaymentComplete callback");
          onPaymentComplete();
        }, 500);
      } else {
        updatePaymentStatus('error');
        setError(response.error || {
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
      console.error("FRONTEND: Error processing payment:", error);
      
      updatePaymentStatus('error');
      setError({
        type: error.details?.type || 'unknown',
        message: error.message || "Failed to process payment"
      });
      
      toast({
        title: "Payment Error",
        description: error.message || "There was a problem with your payment",
        variant: "destructive",
      });
    }
  };

  return {
    paymentStatus: state.paymentStatus,
    errorDetails: state.errorDetails,
    transactionId: state.transactionId,
    bookingId: state.bookingId,
    bookingToken: state.bookingToken,
    processPayment,
    calculatedAmount: state.calculatedAmount,
  };
};
