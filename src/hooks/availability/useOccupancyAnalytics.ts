import { useState, useCallback } from 'react';
import { availabilityEngine } from '@/services/availability/availabilityEngine';
import { DateRange, OccupancyData } from '@/types/availability.types';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface OccupancyAnalyticsState {
  isLoading: boolean;
  error: string | null;
}

export const useOccupancyAnalytics = () => {
  const [state, setState] = useState<OccupancyAnalyticsState>({
    isLoading: false,
    error: null
  });

  // Get occupancy analytics
  const getOccupancyRate = useCallback(async (
    roomId: string, 
    timeRange: DateRange
  ): Promise<OccupancyData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await availabilityEngine.getOccupancyRate(roomId, timeRange);
      
      setState(prev => ({ ...prev, isLoading: false }));

      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get occupancy data';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      toast({
        title: "Analytics Failed",
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
    
    // Actions
    getOccupancyRate,
    clearError
  };
};