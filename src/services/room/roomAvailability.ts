
import { Room } from "@/types/hotel.types";
import { getRooms } from "./roomQueries";
import { toNigerianTime, getCheckoutTimeOnDate } from "@/utils/availabilityUtils";
import { isSameDay } from "date-fns";

export const getAvailableRooms = async (checkIn: Date, checkOut: Date): Promise<Room[]> => {
  try {
    const allRooms = await getRooms();
    const now = new Date();
    
    return allRooms.filter(room => {
      if (!room.availability) return false;
      if (!room.bookings || room.bookings.length === 0) return true;
      
      return !room.bookings.some(booking => {
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        
        if (isSameDay(bookingCheckOut, now)) {
          const currentNigerianTime = toNigerianTime(now);
          const checkoutTimeToday = getCheckoutTimeOnDate(currentNigerianTime);
          
          if (currentNigerianTime >= checkoutTimeToday) {
            return false;
          }
        }
        
        return (
          (checkIn >= bookingCheckIn && checkIn < bookingCheckOut) ||
          (checkOut > bookingCheckIn && checkOut <= bookingCheckOut) ||
          (checkIn <= bookingCheckIn && checkOut >= bookingCheckOut)
        );
      });
    });
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    throw error;
  }
};
