
import { useState } from 'react';
import { PaymentStatus, APIError } from "@/components/payment/payment.types";

export interface PaymentState {
  paymentStatus: PaymentStatus;
  errorDetails: APIError | null;
  clientSecret: string;
  paymentIntentId: string;
  transactionId: string;
  bookingId: string;
  bookingToken: string;
  calculatedAmount: number | null;
}

export const usePaymentState = () => {
  const [state, setState] = useState<PaymentState>({
    paymentStatus: 'idle',
    errorDetails: null,
    clientSecret: '',
    paymentIntentId: '',
    transactionId: generateTransactionId(),
    bookingId: '',
    bookingToken: '',
    calculatedAmount: null,
  });

  function generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  const updatePaymentStatus = (status: PaymentStatus) => {
    setState(prev => ({ ...prev, paymentStatus: status }));
  };

  const updateStatus = (status: PaymentStatus) => {
    setState(prev => ({ ...prev, paymentStatus: status }));
  };

  const setError = (error: APIError | string) => {
    const errorObj = typeof error === 'string' 
      ? { type: 'unknown', message: error }
      : error;
    setState(prev => ({ 
      ...prev, 
      paymentStatus: 'error', 
      errorDetails: errorObj 
    }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, errorDetails: null }));
  };

  const setPaymentIntent = (paymentIntentId: string, calculatedAmount: number | null, clientSecret: string) => {
    setState(prev => ({ 
      ...prev, 
      clientSecret,
      paymentIntentId,
      calculatedAmount,
      paymentStatus: 'idle'
    }));
  };

  const setBookingComplete = (bookingId: string, bookingToken?: string) => {
    setState(prev => ({ 
      ...prev, 
      bookingId, 
      bookingToken: bookingToken || '', 
      paymentStatus: 'success' 
    }));
  };

  const generateTransactionIdNew = () => {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setState(prev => ({ ...prev, transactionId }));
    return transactionId;
  };

  const resetState = () => {
    setState({
      paymentStatus: 'idle',
      errorDetails: null,
      clientSecret: '',
      paymentIntentId: '',
      transactionId: generateTransactionId(),
      bookingId: '',
      bookingToken: '',
      calculatedAmount: null,
    });
  };

  return {
    state,
    updatePaymentStatus,
    updateStatus,
    setError,
    clearError,
    setPaymentIntent,
    setBookingComplete,
    generateTransactionId: generateTransactionIdNew,
    resetState,
  };
};
