
import { useState } from 'react';
import type { PaymentStatus } from './paymentHooks.types';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentState {
  paymentStatus: PaymentStatus;
  errorDetails: string | null;
  transactionId: string;
  bookingId: string | null;
  bookingToken: string;
  calculatedAmount: number | null;
  paymentIntentId: string | null;
}

export const usePaymentState = () => {
  const [state, setState] = useState<PaymentState>({
    paymentStatus: 'idle',
    errorDetails: null,
    transactionId: uuidv4(),
    bookingId: null,
    bookingToken: uuidv4(),
    calculatedAmount: null,
    paymentIntentId: null,
  });

  const updateStatus = (status: PaymentStatus) => {
    console.log(`🔧 PaymentState: Status changed from ${state.paymentStatus} to ${status}`);
    setState(prev => ({ ...prev, paymentStatus: status }));
  };

  const setError = (error: string) => {
    console.error('🔧 PaymentState: Error set:', error);
    setState(prev => ({ 
      ...prev, 
      paymentStatus: 'error', 
      errorDetails: error 
    }));
  };

  const setPaymentIntent = (paymentIntentId: string, calculatedAmount: number) => {
    console.log('🔧 PaymentState: Payment intent set:', { paymentIntentId, calculatedAmount });
    setState(prev => ({ 
      ...prev, 
      paymentIntentId, 
      calculatedAmount,
      paymentStatus: 'ready'
    }));
  };

  const setBookingComplete = (bookingId: string) => {
    console.log('🔧 PaymentState: Booking completed:', bookingId);
    setState(prev => ({ 
      ...prev, 
      bookingId, 
      paymentStatus: 'completed' 
    }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, errorDetails: null }));
  };

  return {
    state,
    updateStatus,
    setError,
    setPaymentIntent,
    setBookingComplete,
    clearError,
  };
};
