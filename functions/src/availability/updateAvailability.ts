import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "../utils/logger";
import { asyncHandler } from "../utils/asyncHandler";

interface UpdateAvailabilityRequest {
  roomId: string;
  dates: string[]; // Array of YYYY-MM-DD date strings
  status: 'blocked' | 'available' | 'maintenance';
  reason?: string;
}

interface UpdateAvailabilityResponse {
  success: boolean;
  conflicts?: Array<{
    date: string;
    reason: string;
  }>;
  message: string;
}

export const updateAvailability = onCall<UpdateAvailabilityRequest, UpdateAvailabilityResponse>(
  asyncHandler(async (request) => {
    const { auth, data } = request;
    
    // Security: Verify admin status
    if (!auth?.token?.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { roomId, dates, status, reason } = data;
    
    if (!roomId || !dates || !status) {
      throw new Error("Missing required fields: roomId, dates, and status");
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      throw new Error("Dates must be a non-empty array");
    }

    const db = getFirestore();
    const conflicts: Array<{ date: string; reason: string }> = [];
    
    try {
      // Group dates by year for efficient processing
      const datesByYear = new Map<string, string[]>();
      
      dates.forEach(dateStr => {
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) {
          throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
        }
        
        const yearKey = year;
        const dateKey = `${month}-${day}`;
        
        if (!datesByYear.has(yearKey)) {
          datesByYear.set(yearKey, []);
        }
        datesByYear.get(yearKey)!.push(dateKey);
      });

      // Process each year in a transaction
      for (const [year, yearDates] of datesByYear) {
        await db.runTransaction(async (transaction) => {
          const availabilityRef = db
            .collection('rooms')
            .doc(roomId)
            .collection('availability')
            .doc(year);
          
          const availabilityDoc = await transaction.get(availabilityRef);
          const currentData = availabilityDoc.data() || {};
          
          // Check for conflicts
          for (const dateKey of yearDates) {
            const currentStatus = currentData[dateKey];
            
            if (currentStatus?.status === 'booked' && status !== 'available') {
              conflicts.push({
                date: `${year}-${dateKey}`,
                reason: `Date is already booked (Booking ID: ${currentStatus.bookingId})`
              });
              continue;
            }
            
            // If unblocking, verify it's actually blocked
            if (status === 'available' && (!currentStatus || currentStatus.status === 'available')) {
              // This is fine, already available
              continue;
            }
          }
          
          // If there are conflicts with booked dates, abort transaction
          const bookingConflicts = conflicts.filter(c => c.reason.includes('booked'));
          if (bookingConflicts.length > 0) {
            throw new Error(`Cannot modify dates that are already booked: ${bookingConflicts.map(c => c.date).join(', ')}`);
          }
          
          // Apply updates
          const updates: { [key: string]: any } = {};
          
          for (const dateKey of yearDates) {
            if (status === 'available') {
              // Remove the date entry to mark as available
              updates[dateKey] = FieldValue.delete();
            } else {
              // Set the blocked/maintenance status
              updates[dateKey] = {
                status,
                reason: reason || (status === 'maintenance' ? 'Scheduled maintenance' : 'Blocked by admin'),
                blockedBy: auth.uid,
                blockedAt: new Date().toISOString()
              };
            }
          }
          
          // Apply all updates at once
          if (Object.keys(updates).length > 0) {
            transaction.set(availabilityRef, updates, { merge: true });
          }
        });
      }

      // Log the operation
      logger.info(`Availability updated for room ${roomId}`, {
        roomId,
        dates: dates.length,
        status,
        reason,
        adminId: auth.uid,
        conflicts: conflicts.length
      });

      return {
        success: true,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        message: conflicts.length > 0 
          ? `Updated with ${conflicts.length} conflicts` 
          : `Successfully updated ${dates.length} dates`
      };
      
    } catch (error) {
      logger.error(`Failed to update availability for room ${roomId}`, error);
      throw new Error(`Failed to update availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })
);