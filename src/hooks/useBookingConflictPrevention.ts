import { useEffect } from 'react';
import { useReservationHold } from './booking/useReservationHold';
import { useBookingProcess } from './booking/useBookingProcess';
import { BookingPeriod } from '@/types/hotel.types';

/**
 * Combined booking conflict prevention hook that orchestrates the booking process
 * This is a facade that combines reservation holds and booking process management
 */
export const useBookingConflictPrevention = () => {
  const reservationHold = useReservationHold();
  const bookingProcess = useBookingProcess();

  // Create reservation hold and update process state
  const createReservationHold = async (
    roomId: string,
    period: BookingPeriod
  ): Promise<boolean> => {
    bookingProcess.updateProcessState({ 
      isLoading: true, 
      step: 'hold',
      error: null 
    });

    const success = await reservationHold.createReservationHold(roomId, period);
    
    if (success && reservationHold.holdState.holdId) {
      bookingProcess.setHoldCreated(reservationHold.holdState.holdId);
    } else {
      bookingProcess.setHoldFailed('Failed to create reservation hold');
    }

    return success;
  };

  // Handle hold expiry by updating process state
  const handleHoldExpiry = () => {
    bookingProcess.updateProcessState({
      step: 'failed',
      error: 'Reservation expired. Please try again.'
    });
  };

  // Reset everything
  const resetBookingProcess = () => {
    reservationHold.releaseHold();
    bookingProcess.resetBookingProcess();
  };

  // Process atomic booking with current hold
  const processAtomicBooking = async (paymentIntentId: string): Promise<string | null> => {
    if (!reservationHold.holdState.holdId) {
      return null;
    }

    const result = await bookingProcess.processAtomicBooking(
      paymentIntentId,
      reservationHold.holdState.holdId
    );

    // If booking successful, clear hold state
    if (result) {
      reservationHold.releaseHold();
    }

    return result;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reservationHold.cleanup();
    };
  }, [reservationHold.cleanup]);

  return {
    // Hold state
    holdState: reservationHold.holdState,
    isHoldActive: reservationHold.isHoldActive,
    timeRemaining: reservationHold.timeRemaining,
    formattedTimeRemaining: reservationHold.formattedTimeRemaining,
    
    // Process state
    processState: bookingProcess.processState,
    currentStep: bookingProcess.currentStep,
    isProcessing: bookingProcess.isProcessing,
    bookingId: bookingProcess.bookingId,
    processError: bookingProcess.processError,
    
    // Actions
    createReservationHold,
    releaseHold: reservationHold.releaseHold,
    processAtomicBooking,
    resetBookingProcess
  };
};