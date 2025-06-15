import { useState, useCallback, useRef } from 'react';
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

export const useReservationHold = () => {
  const { currentUser } = useAuth();
  const [holdState, setHoldState] = useState<ReservationHoldState>({
    holdId: null,
    isActive: false,
    expiresAt: null,
    timeRemaining: 0
  });

  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const holdExpiryTimeout = useRef<NodeJS.Timeout | null>(null);

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
      
      toast({
        title: "Reservation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [currentUser, startCountdown, handleHoldExpiry]);

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

  // Format time remaining for display
  const formatTimeRemaining = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    if (holdExpiryTimeout.current) {
      clearTimeout(holdExpiryTimeout.current);
    }
  }, []);

  return {
    // State
    holdState,
    isHoldActive: holdState.isActive,
    timeRemaining: holdState.timeRemaining,
    formattedTimeRemaining: formatTimeRemaining(holdState.timeRemaining),
    
    // Actions
    createReservationHold,
    releaseHold,
    cleanup
  };
};