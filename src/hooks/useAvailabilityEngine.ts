import { useAvailabilityCheck } from './availability/useAvailabilityCheck';
import { useMaintenanceBlocking } from './availability/useMaintenanceBlocking';
import { useOccupancyAnalytics } from './availability/useOccupancyAnalytics';

/**
 * Combined availability engine hook that provides all availability functionality
 * This is a facade that combines multiple focused hooks for backward compatibility
 */
export const useAvailabilityEngine = () => {
  const availabilityCheck = useAvailabilityCheck();
  const maintenanceBlocking = useMaintenanceBlocking();
  const occupancyAnalytics = useOccupancyAnalytics();

  // Combine loading states
  const isLoading = availabilityCheck.isLoading || 
                   maintenanceBlocking.isLoading || 
                   occupancyAnalytics.isLoading;

  // Combine error states (show first non-null error)
  const error = availabilityCheck.error || 
               maintenanceBlocking.error || 
               occupancyAnalytics.error;

  // Clear all errors
  const clearError = () => {
    availabilityCheck.clearError();
    maintenanceBlocking.clearError();
    occupancyAnalytics.clearError();
  };

  return {
    // Combined state
    isLoading,
    error,
    lastChecked: availabilityCheck.lastChecked,
    
    // Availability checking
    checkAvailability: availabilityCheck.checkAvailability,
    getNextAvailable: availabilityCheck.getNextAvailable,
    
    // Maintenance blocking
    blockDates: maintenanceBlocking.blockDates,
    
    // Occupancy analytics
    getOccupancyRate: occupancyAnalytics.getOccupancyRate,
    
    // Combined actions
    clearError
  };
};