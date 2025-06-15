import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { 
  AvailabilityEngine, 
  AvailabilityResult, 
  BlockedPeriod, 
  DateRange, 
  OccupancyData,
  ReservationHold
} from '@/types/availability.types';
import { BookingPeriod } from '@/types/hotel.types';
import { logger } from '@/utils/logger';

class FirebaseAvailabilityEngine implements AvailabilityEngine {
  
  // Cloud Functions callable references
  private checkAvailabilityFn = httpsCallable(functions, 'checkAvailability');
  private getNextAvailableFn = httpsCallable(functions, 'getNextAvailable');
  private blockDatesFn = httpsCallable(functions, 'blockDates');
  private getOccupancyRateFn = httpsCallable(functions, 'getOccupancyRate');
  private createReservationHoldFn = httpsCallable(functions, 'createReservationHold');
  private releaseReservationHoldFn = httpsCallable(functions, 'releaseReservationHold');
  private processAtomicBookingFn = httpsCallable(functions, 'processAtomicBooking');

  /**
   * Check if a room is available for a specific period
   * Server-side function ensures atomicity and real-time accuracy
   */
  async checkAvailability(roomId: string, period: BookingPeriod): Promise<AvailabilityResult> {
    try {
      logger.info('Checking availability', { roomId, period });
      
      const result = await this.checkAvailabilityFn({
        roomId,
        startDate: period.checkIn.toISOString(),
        endDate: period.checkOut.toISOString()
      });

      const data = result.data as AvailabilityResult;
      
      logger.info('Availability check result', { roomId, isAvailable: data.isAvailable });
      return data;
      
    } catch (error) {
      logger.error('Failed to check availability', error);
      throw new Error('Unable to check room availability. Please try again.');
    }
  }

  /**
   * Find the next available date for a room with specified duration
   */
  async getNextAvailable(roomId: string, duration: number): Promise<Date | null> {
    try {
      logger.info('Finding next available date', { roomId, duration });
      
      const result = await this.getNextAvailableFn({
        roomId,
        duration,
        startFrom: new Date().toISOString()
      });

      const data = result.data as { nextAvailable: string | null };
      
      return data.nextAvailable ? new Date(data.nextAvailable) : null;
      
    } catch (error) {
      logger.error('Failed to find next available date', error);
      throw new Error('Unable to find next available date. Please try again.');
    }
  }

  /**
   * Block dates for maintenance or admin purposes
   * Admin-only function with atomic transaction
   */
  async blockDates(roomId: string, periods: BlockedPeriod[]): Promise<void> {
    try {
      logger.info('Blocking dates', { roomId, periodsCount: periods.length });
      
      await this.blockDatesFn({
        roomId,
        periods: periods.map(p => ({
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          reason: p.reason,
          blockedBy: p.blockedBy
        }))
      });

      logger.info('Dates blocked successfully', { roomId });
      
    } catch (error) {
      logger.error('Failed to block dates', error);
      throw new Error('Unable to block dates. Please check permissions and try again.');
    }
  }

  /**
   * Get occupancy rate and revenue analytics for a room
   */
  async getOccupancyRate(roomId: string, timeRange: DateRange): Promise<OccupancyData> {
    try {
      logger.info('Getting occupancy rate', { roomId, timeRange });
      
      const result = await this.getOccupancyRateFn({
        roomId,
        startDate: timeRange.startDate.toISOString(),
        endDate: timeRange.endDate.toISOString()
      });

      const data = result.data as OccupancyData;
      
      logger.info('Occupancy data retrieved', { roomId, rate: data.rate });
      return data;
      
    } catch (error) {
      logger.error('Failed to get occupancy rate', error);
      throw new Error('Unable to retrieve occupancy data. Please try again.');
    }
  }

  /**
   * Create a temporary reservation hold (10-minute TTL)
   * Prevents double-booking during checkout process
   */
  async createReservationHold(roomId: string, period: BookingPeriod, userId: string): Promise<string> {
    try {
      logger.info('Creating reservation hold', { roomId, userId, period });
      
      const result = await this.createReservationHoldFn({
        roomId,
        userId,
        startDate: period.checkIn.toISOString(),
        endDate: period.checkOut.toISOString()
      });

      const data = result.data as { holdId: string };
      
      logger.info('Reservation hold created', { holdId: data.holdId });
      return data.holdId;
      
    } catch (error) {
      logger.error('Failed to create reservation hold', error);
      throw new Error('Unable to reserve room temporarily. Please try again.');
    }
  }

  /**
   * Release a reservation hold manually
   */
  async releaseReservationHold(holdId: string): Promise<void> {
    try {
      logger.info('Releasing reservation hold', { holdId });
      
      await this.releaseReservationHoldFn({ holdId });
      
      logger.info('Reservation hold released', { holdId });
      
    } catch (error) {
      logger.error('Failed to release reservation hold', error);
      // Don't throw error - TTL will handle it automatically
      logger.warn('Hold will be released automatically by TTL policy');
    }
  }

  /**
   * Process atomic booking after successful payment
   * Uses Firestore transaction to prevent double-booking
   */
  async processAtomicBooking(paymentIntentId: string, holdId: string): Promise<string> {
    try {
      logger.info('Processing atomic booking', { paymentIntentId, holdId });
      
      const result = await this.processAtomicBookingFn({
        paymentIntentId,
        holdId
      });

      const data = result.data as { bookingId: string };
      
      logger.info('Atomic booking processed successfully', { bookingId: data.bookingId });
      return data.bookingId;
      
    } catch (error) {
      logger.error('Failed to process atomic booking', error);
      throw new Error('Unable to complete booking. Your payment has been secured. Please contact support.');
    }
  }

  /**
   * Utility: Format date to MM-DD string for availability document keys
   */
  private formatDateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }

  /**
   * Utility: Get all dates between two dates
   */
  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    while (current < endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
}

// Export singleton instance
export const availabilityEngine = new FirebaseAvailabilityEngine();