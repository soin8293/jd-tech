import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "../utils/logger";
import { asyncHandler } from "../utils/asyncHandler";

interface GetBulkAvailabilityRequest {
  roomIds: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  includeBookings?: boolean;
}

interface BulkAvailabilityResponse {
  dateRange: {
    start: string;
    end: string;
  };
  rooms: Array<{
    roomId: string;
    availability: { [date: string]: any };
    stats: {
      totalDays: number;
      availableDays: number;
      bookedDays: number;
      blockedDays: number;
      occupancyRate: number;
    };
  }>;
}

export const getBulkAvailability = onCall<GetBulkAvailabilityRequest, BulkAvailabilityResponse>(
  asyncHandler(async (request): Promise<BulkAvailabilityResponse> => {
    const { auth, data } = request;
    
    // Require authentication
    if (!auth) {
      throw new Error("Authentication required");
    }

    const { roomIds, startDate, endDate, includeBookings = false } = data;
    
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      throw new Error("roomIds must be a non-empty array");
    }

    if (!startDate || !endDate) {
      throw new Error("startDate and endDate are required");
    }

    // Validate date format and range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    if (start >= end) {
      throw new Error("startDate must be before endDate");
    }

    // Limit to reasonable ranges (max 1 year)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      throw new Error("Date range cannot exceed 365 days");
    }

    if (roomIds.length > 20) {
      throw new Error("Cannot query more than 20 rooms at once");
    }

    const db = getFirestore();
    
    try {
      const results: BulkAvailabilityResponse['rooms'] = [];
      
      // Process each room
      for (const roomId of roomIds) {
        const roomAvailability: { [date: string]: any } = {};
        let totalDays = 0;
        let availableDays = 0;
        let bookedDays = 0;
        let blockedDays = 0;
        
        // Get years covered by the date range
        const years = new Set<number>();
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          years.add(date.getFullYear());
        }
        
        // Fetch availability data for each year
        for (const year of years) {
          const availabilityRef = db
            .collection('rooms')
            .doc(roomId)
            .collection('availability')
            .doc(year.toString());
          
          const availabilityDoc = await availabilityRef.get();
          const yearData = availabilityDoc.data() || {};
          
          // Extract data for dates in our range
          for (let date = new Date(Math.max(start.getTime(), new Date(year, 0, 1).getTime())); 
               date <= end && date.getFullYear() === year; 
               date.setDate(date.getDate() + 1)) {
            
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${month}-${day}`;
            const fullDate = date.toISOString().split('T')[0];
            
            const dayStatus = yearData[dateKey];
            totalDays++;
            
            if (dayStatus) {
              roomAvailability[fullDate] = dayStatus;
              
              switch (dayStatus.status) {
                case 'booked':
                  bookedDays++;
                  break;
                case 'blocked':
                case 'maintenance':
                  blockedDays++;
                  break;
                default:
                  availableDays++;
              }
            } else {
              // No status means available
              availableDays++;
              roomAvailability[fullDate] = { status: 'available' };
            }
          }
        }
        
        // Get bookings if requested and user has permission
        if (includeBookings && (auth.token?.admin || auth.uid)) {
          let bookingsQuery = db.collection('bookings')
            .where('rooms', 'array-contains', roomId)
            .where('checkIn', '>=', start)
            .where('checkOut', '<=', end);
          
          // If not admin, filter by user
          if (!auth.token?.admin) {
            bookingsQuery = bookingsQuery.where('userId', '==', auth.uid);
          }
          
          const bookingsSnapshot = await bookingsQuery.get();
          
          // Update availability with booking info
          bookingsSnapshot.docs.forEach(doc => {
            const booking = doc.data();
            const checkIn = new Date(booking.checkIn.toDate());
            const checkOut = new Date(booking.checkOut.toDate());
            
            for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
              const fullDate = date.toISOString().split('T')[0];
              
              if (roomAvailability[fullDate] && roomAvailability[fullDate].status === 'available') {
                // Update stats
                availableDays--;
                bookedDays++;
                
                // Update availability data
                roomAvailability[fullDate] = {
                  status: 'booked',
                  bookingId: doc.id,
                  guestEmail: auth.token?.admin ? booking.userEmail : undefined
                };
              }
            }
          });
        }
        
        const occupancyRate = totalDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;
        
        results.push({
          roomId,
          availability: roomAvailability,
          stats: {
            totalDays,
            availableDays,
            bookedDays,
            blockedDays,
            occupancyRate
          }
        });
      }

      logger.info(`Retrieved bulk availability for ${roomIds.length} rooms`, {
        roomIds: roomIds.length,
        dateRange: { startDate, endDate },
        includeBookings,
        totalDays: daysDiff
      });

      return {
        dateRange: {
          start: startDate,
          end: endDate
        },
        rooms: results
      };
      
    } catch (error) {
      logger.error(`Failed to get bulk availability`, error);
      throw new Error(`Failed to retrieve bulk availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, "getBulkAvailability")
);