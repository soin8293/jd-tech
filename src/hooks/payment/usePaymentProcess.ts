
import { useEffect, useCallback } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import type { BookingDetails } from '@/types/hotel.types';
import { usePaymentState } from './usePaymentState';
import { usePaymentIntentHandler } from './usePaymentIntentHandler';
import { useBookingProcessor } from './useBookingProcessor';
import { PaymentLogger } from './paymentLogger';
import { PaymentValidators } from './paymentValidators';

export const usePaymentProcess = (
  isOpen: boolean,
  bookingDetails: BookingDetails | null,
  onPaymentComplete: () => void
) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const {
    state,
    updateStatus,
    setError,
    setPaymentIntent,
    setBookingComplete,
    clearError,
  } = usePaymentState();

  const { handleCreatePaymentIntent } = usePaymentIntentHandler();
  const { confirmPayment, processBooking } = useBookingProcessor();

  // Create payment intent when modal opens and we have booking details
  useEffect(() => {
    if (isOpen && bookingDetails && !state.calculatedAmount) {
      PaymentLogger.logStateChange('modal_closed', 'modal_opened', { hasBookingDetails: true });
      initializePaymentIntent();
    }
  }, [isOpen, bookingDetails]);

  const initializePaymentIntent = async () => {
    if (!bookingDetails) {
      PaymentLogger.logValidationError('No booking details available', { bookingDetails });
      return;
    }

    const validation = PaymentValidators.validateBookingDetails(bookingDetails);
    if (!validation.isValid) {
      const errorMsg = `Invalid booking data: ${validation.errors.join(', ')}`;
      PaymentLogger.logValidationError(errorMsg, validation.errors);
      setError(errorMsg);
      return;
    }

    try {
      updateStatus('loading');
      clearError();

      const response = await handleCreatePaymentIntent(bookingDetails, state.transactionId);
      setPaymentIntent(response.paymentIntentId, response.calculatedAmount, response.clientSecret);
      
    } catch (error: any) {
      PaymentLogger.logPaymentError(error, 'payment_intent_creation');
      setError(error.message || 'Failed to initialize payment');
      
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const processPayment = useCallback(async (
    paymentType: 'card' | 'google_pay',
    paymentMethodId: string
  ) => {
    const validation = PaymentValidators.validatePaymentReadiness(
      stripe, 
      elements, 
      bookingDetails, 
      state.paymentIntentId
    );

    if (!validation.isValid) {
      const errorMsg = `Payment system not ready: ${validation.errors.join(', ')}`;
      PaymentLogger.logValidationError(errorMsg, validation.errors);
      setError(errorMsg);
      return;
    }

    PaymentLogger.logProcessStart(paymentType, paymentMethodId);
    
    try {
      updateStatus('processing');
      clearError();

      // Step 1: Confirm payment with Stripe using client secret
      const confirmedPaymentIntent = await confirmPayment(
        paymentType, 
        paymentMethodId, 
        state.clientSecret!
      );

      // Step 2: Process booking with backend
      const result = await processBooking(
        confirmedPaymentIntent,
        bookingDetails!,
        state.transactionId,
        paymentType,
        paymentMethodId
      );

      // Step 3: Complete the process
      setBookingComplete(result.bookingId!, result.bookingToken);
      PaymentLogger.logPaymentSuccess(result.bookingId!, result.message);
      
      toast({
        title: "Payment Successful!",
        description: result.message,
        variant: "default",
      });
      
      onPaymentComplete();
      
    } catch (error: any) {
      PaymentLogger.logPaymentError(error, 'payment_processing');
      setError(error.message || 'Payment processing failed');
      
      toast({
        title: "Payment Failed",
        description: error.message || "Payment could not be processed. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    stripe, 
    elements, 
    bookingDetails, 
    state.paymentIntentId, 
    state.transactionId,
    state.clientSecret,
    confirmPayment,
    processBooking,
    onPaymentComplete,
    toast
  ]);

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
