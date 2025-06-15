import { useState, useCallback } from 'react';
import { availabilityEngine } from '@/services/availability/availabilityEngine';
import { AvailabilityResult } from '@/types/availability.types';
import { BookingPeriod } from '@/types/hotel.types';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AvailabilityCheckState {
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export const useAvailabilityCheck = () => {
  const [state, setState] = useState<AvailabilityCheckState>({
    isLoading: false,
    error: null,
    lastChecked: null
  });

  // Check room availability
  const checkAvailability = useCallback(async (
    roomId: string, 
    period: BookingPeriod
  ): Promise<AvailabilityResult | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await availabilityEngine.checkAvailability(roomId, period);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastChecked: new Date() 
      }));

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to check availability';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      toast({
        title: "Availability Check Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, []);

  // Find next available date
  const getNextAvailable = useCallback(async (
    roomId: string, 
    duration: number
  ): Promise<Date | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nextDate = await availabilityEngine.getNextAvailable(roomId, duration);
      
      setState(prev => ({ ...prev, isLoading: false }));

      if (nextDate) {
        toast({
          title: "Next Available Date Found",
          description: `Room is available starting ${nextDate.toLocaleDateString()}`,
        });
      } else {
        toast({
          title: "No Availability",
          description: "No available dates found in the next 6 months",
          variant: "destructive",
        });
      }

      return nextDate;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to find next available date';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    lastChecked: state.lastChecked,
    
    // Actions
    checkAvailability,
    getNextAvailable,
    clearError
  };
};