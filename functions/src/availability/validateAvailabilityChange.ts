import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "../utils/logger";

interface ValidateAvailabilityRequest {
  roomId: string;
  dates: string[]; // Array of YYYY-MM-DD date strings
  operation: 'block' | 'unblock' | 'maintenance';
}

interface ValidationResult {
  valid: boolean;
  conflicts: Array<{
    date: string;
    currentStatus: string;
    reason: string;
    canOverride: boolean;
  }>;
  warnings: Array<{
    date: string;
    message: string;
  }>;
}

export const validateAvailabilityChange = onCall<ValidateAvailabilityRequest, ValidationResult>(
  async (request) => {
    logger.setContext({ function: "validateAvailabilityChange" });
    logger.info("Function validateAvailabilityChange started");

    try {
      const { auth, data } = request;
      
      // Require admin authentication
      if (!auth?.token?.admin) {
        throw new HttpsError("permission-denied", "Unauthorized: Admin access required");
      }

      const { roomId, dates, operation } = data;
      
      if (!roomId || !dates || !operation) {
        throw new HttpsError("invalid-argument", "Missing required fields: roomId, dates, and operation");
      }

      if (!Array.isArray(dates) || dates.length === 0) {
        throw new HttpsError("invalid-argument", "Dates must be a non-empty array");
      }

      const db = getFirestore();
      const conflicts: ValidationResult['conflicts'] = [];
      const warnings: ValidationResult['warnings'] = [];
      
      // Group dates by year for efficient processing
      const datesByYear = new Map<string, string[]>();
      
      dates.forEach(dateStr => {
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) {
          throw new HttpsError("invalid-argument", `Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
        }
        
        const yearKey = year;
        const dateKey = `${month}-${day}`;
        
        if (!datesByYear.has(yearKey)) {
          datesByYear.set(yearKey, []);
        }
        datesByYear.get(yearKey)!.push(dateKey);
      });

      // Check each year's availability
      for (const [year, yearDates] of datesByYear) {
        const availabilityRef = db
          .collection('rooms')
          .doc(roomId)
          .collection('availability')
          .doc(year);
        
        const availabilityDoc = await availabilityRef.get();
        const currentData = availabilityDoc.data() || {};
        
        // Also check for existing bookings in this period
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);
        
        const bookingsSnapshot = await db.collection('bookings')
          .where('rooms', 'array-contains', roomId)
          .where('checkIn', '>=', startDate)
          .where('checkOut', '<=', endDate)
          .where('status', 'in', ['confirmed', 'checked_in'])
          .get();
        
        // Build a map of booked dates
        const bookedDates = new Set<string>();
        bookingsSnapshot.docs.forEach(doc => {
          const booking = doc.data();
          const checkIn = new Date(booking.checkIn.toDate());
          const checkOut = new Date(booking.checkOut.toDate());
          
          for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            bookedDates.add(`${month}-${day}`);
          }
        });
        
        // Validate each date
        for (const dateKey of yearDates) {
          const fullDate = `${year}-${dateKey}`;
          const currentStatus = currentData[dateKey];
          const isBooked = bookedDates.has(dateKey);
          
          // Check for booking conflicts
          if (isBooked && operation !== 'unblock') {
            conflicts.push({
              date: fullDate,
              currentStatus: 'booked',
              reason: 'Date has confirmed booking',
              canOverride: false
            });
            continue;
          }
          
          // Check current status conflicts
          if (currentStatus) {
            switch (operation) {
              case 'block':
              case 'maintenance':
                if (currentStatus.status === 'blocked' || currentStatus.status === 'maintenance') {
                  warnings.push({
                    date: fullDate,
                    message: `Date is already ${currentStatus.status}. Will update reason.`
                  });
                }
                break;
              
              case 'unblock':
                if (currentStatus.status === 'available') {
                  warnings.push({
                    date: fullDate,
                    message: 'Date is already available'
                  });
                } else if (currentStatus.status === 'booked') {
                  conflicts.push({
                    date: fullDate,
                    currentStatus: 'booked',
                    reason: 'Cannot unblock a booked date',
                    canOverride: false
                  });
                }
                break;
            }
          } else {
            // No current status means it's available
            if (operation === 'unblock') {
              warnings.push({
                date: fullDate,
                message: 'Date is already available'
              });
            }
          }
          
          // Check for dates in the past
          const dateObj = new Date(fullDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (dateObj < today) {
            conflicts.push({
              date: fullDate,
              currentStatus: currentStatus?.status || 'available',
              reason: 'Cannot modify dates in the past',
              canOverride: false
            });
          }
        }
      }

      const valid = conflicts.length === 0;

      logger.info(`Validated availability change for room ${roomId}`, {
        roomId,
        operation,
        datesCount: dates.length,
        valid,
        conflictsCount: conflicts.length,
        warningsCount: warnings.length
      });

      logger.info("Function validateAvailabilityChange completed successfully");

      return {
        valid,
        conflicts,
        warnings
      };
      
    } catch (error: any) {
      logger.error("Function validateAvailabilityChange failed", error);
      
      // If it's already an HttpsError, re-throw it
      if (error instanceof HttpsError) {
        throw error;
      }
      
      // Convert generic errors to HttpsError
      throw new HttpsError(
        'internal',
        error.message || 'validateAvailabilityChange failed',
        { 
          type: 'internal_error', 
          originalError: error.message,
          functionName: 'validateAvailabilityChange'
        }
      );
    } finally {
      logger.clearContext();
    }
  }
);