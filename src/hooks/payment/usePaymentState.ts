
import { useState } from 'react';
import { PaymentStatus, APIError } from "@/components/payment/payment.types";
import { v4 as uuidv4 } from 'uuid';

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
    transactionId: '',
    bookingId: '',
    bookingToken: '',
    calculatedAmount: null,
  });

  const updatePaymentStatus = (status: PaymentStatus) => {
    setState(prev => ({ ...prev, paymentStatus: status }));
  };

  const setError = (error: APIError) => {
    setState(prev => ({ 
      ...prev, 
      paymentStatus: 'error', 
      errorDetails: error 
    }));
  };

  const setPaymentIntent = (clientSecret: string, paymentIntentId: string, calculatedAmount?: number) => {
    setState(prev => ({ 
      ...prev, 
      clientSecret, 
      paymentIntentId,
      calculatedAmount: calculatedAmount || null,
      paymentStatus: 'idle'
    }));
  };

  const setBookingComplete = (bookingId: string, bookingToken: string) => {
    setState(prev => ({ 
      ...prev, 
      bookingId, 
      bookingToken, 
      paymentStatus: 'success' 
    }));
  };

  const generateTransactionId = () => {
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
      transactionId: '',
      bookingId: '',
      bookingToken: '',
      calculatedAmount: null,
    });
  };

  return {
    state,
    updatePaymentStatus,
    setError,
    setPaymentIntent,
    setBookingComplete,
    generateTransactionId,
    resetState,
  };
};
