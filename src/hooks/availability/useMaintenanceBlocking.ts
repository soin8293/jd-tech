import { useState, useCallback } from 'react';
import { availabilityEngine } from '@/services/availability/availabilityEngine';
import { BlockedPeriod } from '@/types/availability.types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface MaintenanceBlockingState {
  isLoading: boolean;
  error: string | null;
}

export const useMaintenanceBlocking = () => {
  const { currentUser } = useAuth();
  const [state, setState] = useState<MaintenanceBlockingState>({
    isLoading: false,
    error: null
  });

  // Block dates (admin only)
  const blockDates = useCallback(async (
    roomId: string, 
    periods: BlockedPeriod[]
  ): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to block dates",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await availabilityEngine.blockDates(roomId, periods);
      
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Dates Blocked Successfully",
        description: `${periods.length} period(s) blocked for maintenance`,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to block dates';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      toast({
        title: "Block Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [currentUser]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    blockDates,
    clearError
  };
};