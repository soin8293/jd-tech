import { useState, useCallback } from 'react';
import { availabilityEngine } from '@/services/availability/availabilityEngine';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface BookingProcessState {
  step: 'availability' | 'hold' | 'payment' | 'processing' | 'complete' | 'failed';
  holdId: string | null;
  bookingId: string | null;
  error: string | null;
  isLoading: boolean;
}

export const useBookingProcess = () => {
  const [processState, setProcessState] = useState<BookingProcessState>({
    step: 'availability',
    holdId: null,
    bookingId: null,
    error: null,
    isLoading: false
  });

  // Update process state
  const updateProcessState = useCallback((updates: Partial<BookingProcessState>) => {
    setProcessState(prev => ({ ...prev, ...updates }));
  }, []);

  // Set hold created
  const setHoldCreated = useCallback((holdId: string) => {
    updateProcessState({
      holdId,
      step: 'payment',
      isLoading: false,
      error: null
    });
  }, [updateProcessState]);

  // Set hold failed
  const setHoldFailed = useCallback((error: string) => {
    updateProcessState({
      step: 'failed',
      error,
      isLoading: false
    });
  }, [updateProcessState]);

  // Process atomic booking after payment
  const processAtomicBooking = useCallback(async (
    paymentIntentId: string,
    holdId: string
  ): Promise<string | null> => {
    if (!holdId) {
      toast({
        title: "No Active Reservation",
        description: "Please create a reservation first",
        variant: "destructive",
      });
      return null;
    }

    setProcessState(prev => ({
      ...prev,
      isLoading: true,
      step: 'processing'
    }));

    try {
      const bookingId = await availabilityEngine.processAtomicBooking(
        paymentIntentId,
        holdId
      );

      setProcessState(prev => ({
        ...prev,
        isLoading: false,
        bookingId,
        step: 'complete'
      }));

      toast({
        title: "Booking Confirmed!",
        description: `Your booking has been confirmed. Booking ID: ${bookingId}`,
      });

      logger.info('Atomic booking processed successfully', { bookingId, paymentIntentId });
      return bookingId;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete booking';
      
      setProcessState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        step: 'failed'
      }));

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, []);

  // Reset booking process
  const resetBookingProcess = useCallback(() => {
    setProcessState({
      step: 'availability',
      holdId: null,
      bookingId: null,
      error: null,
      isLoading: false
    });
  }, []);

  return {
    // Process state
    processState,
    currentStep: processState.step,
    isProcessing: processState.isLoading,
    bookingId: processState.bookingId,
    processError: processState.error,
    
    // Actions
    updateProcessState,
    setHoldCreated,
    setHoldFailed,
    processAtomicBooking,
    resetBookingProcess
  };
};