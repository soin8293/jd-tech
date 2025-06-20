
import { Room, BookingPeriod } from "@/types/hotel.types";
import { getRooms } from "../room/roomQueries";
import { checkRoomAvailability } from "@/utils/availabilityUtils";

export const checkRoomAvailability = async (
  period: BookingPeriod,
  guests: number
): Promise<Room[]> => {
  try {
    console.log('Checking room availability for period:', period, 'guests:', guests);
    
    // Get all rooms
    const allRooms = await getRooms();
    
    // Filter rooms based on capacity and availability
    const availableRooms = allRooms.filter(room => {
      // Check basic capacity
      if (room.capacity < guests) {
        return false;
      }
      
      // Check if room is generally available
      if (!room.availability) {
        return false;
      }
      
      // Check for booking conflicts
      if (!room.bookings || room.bookings.length === 0) {
        return true;
      }
      
      // Check if the requested period conflicts with existing bookings
      const hasConflict = room.bookings.some(booking => {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        const requestStart = new Date(period.checkIn);
        const requestEnd = new Date(period.checkOut);
        
        // Check for overlap
        return (requestStart < bookingEnd && requestEnd > bookingStart);
      });
      
      return !hasConflict;
    });
    
    console.log(`Found ${availableRooms.length} available rooms out of ${allRooms.length} total rooms`);
    return availableRooms;
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
};
