
import { differenceInMinutes, isSameDay, parseISO, format } from 'date-fns';
import { Room, BookingPeriod, RoomAvailabilityCheck } from '@/types/hotel.types';

// Nigerian timezone offset in minutes (UTC+1)
const NIGERIAN_TIMEZONE_OFFSET = 60;
// Checkout time in Nigerian time (11:00 AM)
const CHECKOUT_TIME_HOURS = 11;
const CHECKOUT_TIME_MINUTES = 0;

/**
 * Converts a date to Nigerian time
 */
export const toNigerianTime = (date: Date): Date => {
  const nigerianTime = new Date(date);
  
  // Adjust to Nigerian timezone (UTC+1)
  const userTimezoneOffset = date.getTimezoneOffset();
  const totalOffsetInMinutes = userTimezoneOffset + NIGERIAN_TIMEZONE_OFFSET;
  
  nigerianTime.setMinutes(nigerianTime.getMinutes() + totalOffsetInMinutes);
  return nigerianTime;
};

/**
 * Gets the checkout time on a specific date (11:00 AM Nigerian time)
 */
export const getCheckoutTimeOnDate = (date: Date): Date => {
  const checkoutTime = new Date(date);
  checkoutTime.setHours(CHECKOUT_TIME_HOURS, CHECKOUT_TIME_MINUTES, 0, 0);
  return checkoutTime;
};

/**
 * Checks if a room is available for the requested period
 */
export const checkRoomAvailability = (
  room: Room,
  requestedPeriod: BookingPeriod
): RoomAvailabilityCheck => {
  // If room is marked as unavailable
  if (!room.availability) {
    return {
      isAvailable: false,
      unavailableReason: "Room is currently unavailable for booking"
    };
  }
  
  // If room has no bookings
  if (!room.bookings || room.bookings.length === 0) {
    return { isAvailable: true };
  }
  
  const requestedCheckIn = new Date(requestedPeriod.checkIn);
  const requestedCheckOut = new Date(requestedPeriod.checkOut);
  
  // Check against existing bookings
  for (const booking of room.bookings) {
    const bookingCheckIn = new Date(booking.checkIn);
    const bookingCheckOut = new Date(booking.checkOut);
    
    // Check if there's an overlap
    const isOverlapping = (
      (requestedCheckIn >= bookingCheckIn && requestedCheckIn < bookingCheckOut) ||
      (requestedCheckOut > bookingCheckIn && requestedCheckOut <= bookingCheckOut) ||
      (requestedCheckIn <= bookingCheckIn && requestedCheckOut >= bookingCheckOut)
    );
    
    if (isOverlapping) {
      // Special case: If checkout day is the same as requested check-in and current time is past 11 AM Nigerian time
      if (isSameDay(bookingCheckOut, requestedCheckIn)) {
        const currentNigerianTime = toNigerianTime(new Date());
        const checkoutTimeToday = getCheckoutTimeOnDate(currentNigerianTime);
        
        if (currentNigerianTime >= checkoutTimeToday) {
          // After 11 AM Nigerian time, the room becomes available for new bookings
          continue;
        }
        
        return {
          isAvailable: false,
          unavailableReason: "Room is booked until checkout time (11:00 AM Nigerian time)",
          nextAvailableTime: checkoutTimeToday
        };
      }
      
      return {
        isAvailable: false,
        unavailableReason: "Room is already booked for the selected dates",
        nextAvailableTime: bookingCheckOut
      };
    }
  }
  
  return { isAvailable: true };
};

/**
 * Updates room bookings after a successful payment
 */
export const addBookingToRoom = (room: Room, bookingPeriod: BookingPeriod): Room => {
  const updatedRoom = { ...room };
  
  if (!updatedRoom.bookings) {
    updatedRoom.bookings = [];
  }
  
  updatedRoom.bookings.push({
    checkIn: new Date(bookingPeriod.checkIn),
    checkOut: new Date(bookingPeriod.checkOut)
  });
  
  return updatedRoom;
};

/**
 * Formats a date to show Nigerian time
 */
export const formatNigerianTime = (date: Date): string => {
  const nigerianTime = toNigerianTime(date);
  return format(nigerianTime, "MMM d, yyyy 'at' h:mm a '(Nigerian time)'");
};
