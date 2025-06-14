/**
 * Centralized booking service for all booking-related operations
 * Handles booking creation, validation, price calculation, and state management
 */

import { differenceInDays, format } from "date-fns";
import { BookingDetails, BookingPeriod, Room } from "@/types/hotel.types";

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BookingCalculation {
  nights: number;
  totalPrice: number;
  priceBreakdown: {
    roomId: string;
    roomName: string;
    pricePerNight: number;
    nights: number;
    subtotal: number;
  }[];
}

/**
 * Validates booking parameters before processing
 */
export const validateBooking = (
  selectedRooms: Room[],
  bookingPeriod: BookingPeriod,
  guests: number
): BookingValidationResult => {
  const errors: string[] = [];

  // Check if rooms are selected
  if (!selectedRooms || selectedRooms.length === 0) {
    errors.push("Please select at least one room to continue.");
  }

  // Check if dates are valid
  if (!bookingPeriod.checkIn || !bookingPeriod.checkOut) {
    errors.push("Please select valid check-in and check-out dates.");
  }

  // Check if check-in is before check-out
  if (bookingPeriod.checkIn >= bookingPeriod.checkOut) {
    errors.push("Check-out date must be after check-in date.");
  }

  // Check if guest count is valid
  if (guests < 1) {
    errors.push("Number of guests must be at least 1.");
  }

  // Check room capacity
  const totalCapacity = selectedRooms.reduce((sum, room) => sum + room.capacity, 0);
  if (guests > totalCapacity) {
    errors.push(`Selected rooms can accommodate maximum ${totalCapacity} guests, but ${guests} guests were specified.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculates booking price and breakdown
 */
export const calculateBookingPrice = (
  selectedRooms: Room[],
  bookingPeriod: BookingPeriod
): BookingCalculation => {
  const nights = differenceInDays(bookingPeriod.checkOut, bookingPeriod.checkIn);
  
  const priceBreakdown = selectedRooms.map(room => ({
    roomId: room.id,
    roomName: room.name,
    pricePerNight: room.price,
    nights,
    subtotal: room.price * nights
  }));

  const totalPrice = priceBreakdown.reduce((sum, breakdown) => sum + breakdown.subtotal, 0);

  return {
    nights,
    totalPrice,
    priceBreakdown
  };
};

/**
 * Creates a complete booking details object
 */
export const createBookingDetails = (
  selectedRooms: Room[],
  bookingPeriod: BookingPeriod,
  guests: number
): BookingDetails => {
  const calculation = calculateBookingPrice(selectedRooms, bookingPeriod);

  return {
    period: bookingPeriod,
    guests,
    rooms: selectedRooms,
    totalPrice: calculation.totalPrice
  };
};

/**
 * Formats booking confirmation message
 */
export const formatBookingConfirmation = (
  roomCount: number,
  checkIn: Date,
  checkOut: Date
): string => {
  return `You have successfully booked ${roomCount} room${roomCount !== 1 ? "s" : ""} from ${format(checkIn, "MMM d, yyyy")} to ${format(checkOut, "MMM d, yyyy")}.`;
};

/**
 * Stores user email for booking (if user is authenticated)
 */
export const storeUserEmailForBooking = (userEmail?: string): void => {
  if (userEmail) {
    localStorage.setItem('userEmail', userEmail);
  }
};

/**
 * Retrieves stored user email for booking
 */
export const getStoredUserEmail = (): string | null => {
  return localStorage.getItem('userEmail');
};

/**
 * Booking service class for managing booking state and operations
 */
export class BookingService {
  private static instance: BookingService;

  private constructor() {}

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Process a complete booking workflow
   */
  async processBooking(
    selectedRooms: Room[],
    bookingPeriod: BookingPeriod,
    guests: number,
    userEmail?: string
  ): Promise<BookingDetails> {
    // Validate booking
    const validation = validateBooking(selectedRooms, bookingPeriod, guests);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(" "));
    }

    // Store user email if provided
    storeUserEmailForBooking(userEmail);

    // Create booking details
    const bookingDetails = createBookingDetails(selectedRooms, bookingPeriod, guests);

    // Future: Add booking persistence, room locking, etc.
    console.log("Processing booking:", bookingDetails);

    return bookingDetails;
  }

  /**
   * Get booking price estimate
   */
  getBookingEstimate(
    selectedRooms: Room[],
    bookingPeriod: BookingPeriod
  ): BookingCalculation {
    return calculateBookingPrice(selectedRooms, bookingPeriod);
  }
}

// Export singleton instance
export const bookingService = BookingService.getInstance();