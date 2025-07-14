
import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { CreatePaymentIntentParams, CreatePaymentIntentResponse } from './paymentHooks.types';
import { PaymentIntentError } from './paymentUtils';

export const usePaymentIntent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentData, setPaymentIntentData] = useState<CreatePaymentIntentResponse | null>(null);

  const createPaymentIntent = useCallback(async (params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResponse> => {
    console.log("🔧 usePaymentIntent: Creating payment intent with params:", params);
    
    setIsLoading(true);
    setError(null);

    try {
      // Validate that we have actual room data
      if (!params.rooms || params.rooms.length === 0) {
        throw new Error("No rooms selected for payment");
      }

      if (!params.period || !params.period.checkIn || !params.period.checkOut) {
        throw new Error("Invalid booking period provided");
      }

      console.log("🔧 usePaymentIntent: Calling createPaymentIntent function with:", {
        roomCount: params.rooms.length,
        roomIds: params.rooms.map(r => r.id),
        period: params.period,
        guests: params.guests,
        fullParams: params
      });

      const createPaymentIntentFn = httpsCallable<CreatePaymentIntentParams, CreatePaymentIntentResponse>(
        functions, 
        'createPaymentIntent'
      );
      
      const result = await createPaymentIntentFn(params);
      
      console.log("🔧 usePaymentIntent: Payment intent created successfully:", result.data);
      
      setPaymentIntentData(result.data);
      return result.data;
      
    } catch (error: any) {
      console.error("🔧 usePaymentIntent: Error creating payment intent:", error);
      
      const errorMessage = error.message || 'Failed to create payment intent';
      setError(errorMessage);
      
      throw new PaymentIntentError(
        errorMessage,
        error.code || 'unknown',
        error.details || {}
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPaymentIntentData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    createPaymentIntent,
    paymentIntentData,
    isLoading,
    error,
    reset
  };
};
