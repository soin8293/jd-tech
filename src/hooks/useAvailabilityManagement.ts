import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface UpdateAvailabilityRequest {
  roomId: string;
  dates: string[];
  status: 'blocked' | 'available' | 'maintenance';
  reason?: string;
}

interface ValidationRequest {
  roomId: string;
  dates: string[];
  operation: 'block' | 'unblock' | 'maintenance';
}

interface GetCalendarRequest {
  roomId: string;
  year: number;
  includeBookings?: boolean;
}

interface BulkAvailabilityRequest {
  roomIds: string[];
  startDate: string;
  endDate: string;
  includeBookings?: boolean;
}

export const useAvailabilityManagement = () => {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const updateAvailability = httpsCallable(functions, 'updateAvailability');
  const validateAvailabilityChange = httpsCallable(functions, 'validateAvailabilityChange');
  const getAvailabilityCalendar = httpsCallable(functions, 'getAvailabilityCalendar');
  const getBulkAvailability = httpsCallable(functions, 'getBulkAvailability');

  const handleUpdateAvailability = useCallback(async (request: UpdateAvailabilityRequest) => {
    setLoading(true);
    try {
      logger.info('Updating room availability', request);
      
      const result = await updateAvailability(request);
      const data = result.data as any;
      
      if (data.success) {
        toast({
          title: "Availability Updated",
          description: data.message,
        });
        
        if (data.conflicts && data.conflicts.length > 0) {
          toast({
            title: "Some conflicts occurred",
            description: `${data.conflicts.length} dates had issues. Check the details.`,
            variant: "destructive",
          });
        }
      }
      
      return data;
    } catch (error) {
      logger.error('Failed to update availability', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update availability",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateAvailability, toast]);

  const handleValidateChange = useCallback(async (request: ValidationRequest) => {
    setValidating(true);
    try {
      logger.info('Validating availability change', request);
      
      const result = await validateAvailabilityChange(request);
      const data = result.data as any;
      
      return data;
    } catch (error) {
      logger.error('Failed to validate availability change', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate changes",
        variant: "destructive",
      });
      throw error;
    } finally {
      setValidating(false);
    }
  }, [validateAvailabilityChange, toast]);

  const handleGetCalendar = useCallback(async (request: GetCalendarRequest) => {
    try {
      logger.info('Fetching availability calendar', request);
      
      const result = await getAvailabilityCalendar(request);
      const data = result.data as any;
      
      return data;
    } catch (error) {
      logger.error('Failed to fetch availability calendar', error);
      toast({
        title: "Failed to Load Calendar",
        description: error instanceof Error ? error.message : "Failed to fetch calendar data",
        variant: "destructive",
      });
      throw error;
    }
  }, [getAvailabilityCalendar, toast]);

  const handleGetBulkAvailability = useCallback(async (request: BulkAvailabilityRequest) => {
    try {
      logger.info('Fetching bulk availability', request);
      
      const result = await getBulkAvailability(request);
      const data = result.data as any;
      
      return data;
    } catch (error) {
      logger.error('Failed to fetch bulk availability', error);
      toast({
        title: "Failed to Load Data",
        description: error instanceof Error ? error.message : "Failed to fetch availability data",
        variant: "destructive",
      });
      throw error;
    }
  }, [getBulkAvailability, toast]);

  return {
    loading,
    validating,
    updateAvailability: handleUpdateAvailability,
    validateChange: handleValidateChange,
    getCalendar: handleGetCalendar,
    getBulkAvailability: handleGetBulkAvailability,
  };
};