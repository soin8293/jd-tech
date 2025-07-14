import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "../utils/logger";
import { asyncHandler } from "../utils/asyncHandler";

interface GetAvailabilityRequest {
  roomId: string;
  year: number;
  includeBookings?: boolean;
}

interface AvailabilityCalendarResponse {
  roomId: string;
  year: number;
  availability: { [dateKey: string]: any };
  bookings?: Array<{
    id: string;
    checkIn: string;
    checkOut: string;
    guestEmail?: string;
  }>;
}

export const getAvailabilityCalendar = onCall<GetAvailabilityRequest, AvailabilityCalendarResponse>(
  asyncHandler(async (request): Promise<AvailabilityCalendarResponse> => {
    const { auth, data } = request;
    
    // Require authentication
    if (!auth) {
      throw new Error("Authentication required");
    }

    const { roomId, year, includeBookings = false } = data;
    
    if (!roomId || !year) {
      throw new Error("Missing required fields: roomId and year");
    }

    if (year < 2020 || year > 2030) {
      throw new Error("Year must be between 2020 and 2030");
    }

    const db = getFirestore();
    
    try {
      // Get availability data
      const availabilityRef = db
        .collection('rooms')
        .doc(roomId)
        .collection('availability')
        .doc(year.toString());
      
      const availabilityDoc = await availabilityRef.get();
      const availability = availabilityDoc.data() || {};
      
      let bookings: any[] | undefined;
      
      if (includeBookings) {
        // Get bookings for the year (only if admin or the specific booking owner)
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);
        
        let bookingsQuery = db.collection('bookings')
          .where('rooms', 'array-contains', roomId)
          .where('checkIn', '>=', startOfYear)
          .where('checkIn', '<=', endOfYear);
        
        // If not admin, filter by user
        if (!auth.token?.admin) {
          bookingsQuery = bookingsQuery.where('userId', '==', auth.uid);
        }
        
        const bookingsSnapshot = await bookingsQuery.get();
        
        bookings = bookingsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            checkIn: data.checkIn.toDate().toISOString().split('T')[0],
            checkOut: data.checkOut.toDate().toISOString().split('T')[0],
            guestEmail: auth.token?.admin ? data.userEmail : undefined
          };
        });
        
        // Add booking info to availability data
        bookings.forEach(booking => {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);
          
          for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${month}-${day}`;
            
            if (!availability[dateKey]) {
              availability[dateKey] = {
                status: 'booked',
                bookingId: booking.id,
                guestEmail: booking.guestEmail
              };
            }
          }
        });
      }

      logger.info(`Retrieved availability calendar for room ${roomId}, year ${year}`, {
        roomId,
        year,
        availabilityDates: Object.keys(availability).length,
        includeBookings,
        bookingsCount: bookings?.length || 0
      });

      return {
        roomId,
        year,
        availability,
        bookings
      };
      
    } catch (error) {
      logger.error(`Failed to get availability calendar for room ${roomId}`, error);
      throw new Error(`Failed to retrieve calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, "getAvailabilityCalendar")
);