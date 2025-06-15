import { useState, useCallback, useEffect, useRef } from 'react';
import { availabilityEngine } from '@/services/availability/availabilityEngine';
import { BookingPeriod } from '@/types/hotel.types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ReservationHoldState {
  holdId: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  timeRemaining: number; // seconds
}

interface BookingProcessState {
  step: 'availability' | 'hold' | 'payment' | 'processing' | 'complete' | 'failed';
  holdId: string | null;
  bookingId: string | null;
  error: string | null;
  isLoading: boolean;
}

export const useBookingConflictPrevention = () => {
  const { currentUser } = useAuth();
  const [holdState, setHoldState] = useState<ReservationHoldState>({
    holdId: null,
    isActive: false,
    expiresAt: null,
    timeRemaining: 0
  });

  const [processState, setProcessState] = useState<BookingProcessState>({
    step: 'availability',
    holdId: null,
    bookingId: null,
    error: null,
    isLoading: false
  });

  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const holdExpiryTimeout = useRef<NodeJS.Timeout | null>(null);

  // Create reservation hold (10-minute timer)
  const createReservationHold = useCallback(async (
    roomId: string,
    period: BookingPeriod
  ): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a reservation",
        variant: "destructive",
      });
      return false;
    }

    setProcessState(prev => ({ 
      ...prev, 
      isLoading: true, 
      step: 'hold',
      error: null 
    }));

    try {
      const holdId = await availabilityEngine.createReservationHold(
        roomId, 
        period, 
        currentUser.uid
      );

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      setHoldState({
        holdId,
        isActive: true,
        expiresAt,
        timeRemaining: 600 // 10 minutes in seconds
      });

      setProcessState(prev => ({
        ...prev,
        isLoading: false,
        holdId,
        step: 'payment'
      }));

      // Start countdown timer
      startCountdown(expiresAt);

      // Set expiry timeout
      holdExpiryTimeout.current = setTimeout(() => {
        handleHoldExpiry();
      }, 10 * 60 * 1000);

      toast({
        title: "Room Reserved",
        description: "You have 10 minutes to complete your booking",
      });

      logger.info('Reservation hold created', { holdId, roomId });
      return true;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reserve room';
      
      setProcessState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        step: 'failed'
      }));

      toast({
        title: "Reservation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [currentUser]);

  // Start countdown timer
  const startCountdown = useCallback((expiresAt: Date) => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    countdownInterval.current = setInterval(() => {
      const now = new Date();
      const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

      setHoldState(prev => ({
        ...prev,
        timeRemaining
      }));

      if (timeRemaining <= 0) {
        handleHoldExpiry();
      }
    }, 1000);
  }, []);

  // Handle hold expiry
  const handleHoldExpiry = useCallback(() => {
    setHoldState({
      holdId: null,
      isActive: false,
      expiresAt: null,
      timeRemaining: 0
    });

    setProcessState(prev => ({
      ...prev,
      step: 'failed',
      error: 'Reservation expired. Please try again.'
    }));

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    if (holdExpiryTimeout.current) {
      clearTimeout(holdExpiryTimeout.current);
      holdExpiryTimeout.current = null;
    }

    toast({
      title: "Reservation Expired",
      description: "Your 10-minute reservation has expired. Please try again.",
      variant: "destructive",
    });

    logger.warn('Reservation hold expired', { holdId: holdState.holdId });
  }, [holdState.holdId]);

  // Release hold manually
  const releaseHold = useCallback(async () => {
    if (!holdState.holdId) return;

    try {
      await availabilityEngine.releaseReservationHold(holdState.holdId);
      
      setHoldState({
        holdId: null,
        isActive: false,
        expiresAt: null,
        timeRemaining: 0
      });

      // Clear timers
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }

      if (holdExpiryTimeout.current) {
        clearTimeout(holdExpiryTimeout.current);
        holdExpiryTimeout.current = null;
      }

      logger.info('Reservation hold released manually', { holdId: holdState.holdId });

    } catch (error) {
      logger.error('Failed to release hold manually', error);
      // TTL will handle it automatically
    }
  }, [holdState.holdId]);

  // Process atomic booking after payment
  const processAtomicBooking = useCallback(async (paymentIntentId: string): Promise<string | null> => {
    if (!holdState.holdId) {
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
        holdState.holdId
      );

      // Clear hold state (booking successful)
      setHoldState({
        holdId: null,
        isActive: false,
        expiresAt: null,
        timeRemaining: 0
      });

      setProcessState(prev => ({
        ...prev,
        isLoading: false,
        bookingId,
        step: 'complete'
      }));

      // Clear timers
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }

      if (holdExpiryTimeout.current) {
        clearTimeout(holdExpiryTimeout.current);
        holdExpiryTimeout.current = null;
      }

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
  }, [holdState.holdId]);

  // Reset booking process
  const resetBookingProcess = useCallback(() => {
    // Release any active hold
    if (holdState.isActive) {
      releaseHold();
    }

    setProcessState({
      step: 'availability',
      holdId: null,
      bookingId: null,
      error: null,
      isLoading: false
    });
  }, [holdState.isActive, releaseHold]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (holdExpiryTimeout.current) {
        clearTimeout(holdExpiryTimeout.current);
      }
    };
  }, []);

  return {
    // Hold state
    holdState,
    isHoldActive: holdState.isActive,
    timeRemaining: holdState.timeRemaining,
    formattedTimeRemaining: formatTimeRemaining(holdState.timeRemaining),
    
    // Process state
    processState,
    currentStep: processState.step,
    isProcessing: processState.isLoading,
    bookingId: processState.bookingId,
    processError: processState.error,
    
    // Actions
    createReservationHold,
    releaseHold,
    processAtomicBooking,
    resetBookingProcess
  };
};