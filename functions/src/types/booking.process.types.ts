
import { BookingPeriod, Room } from "../types/booking.types";

// Define our own BookingData type since it's not exported from booking.types
export interface BookingData {
  period: {
    checkIn: string;
    checkOut: string;
  };
  guests: number;
  rooms: Room[];
  totalPrice: number;
  userEmail?: string;
  contactPhone?: string;
  specialRequests?: string;
}

export interface ProcessBookingParams {
  paymentIntentId: string;
  transaction_id: string;
  userEmail?: string;
  userId?: string;
  paymentType: string;
  paymentMethodId?: string;
  bookingDetails: BookingData;
}

export interface PaymentResponse {
  success: boolean;
  partial?: boolean;
  bookingId?: string;
  bookingToken?: string;
  paymentStatus?: string;
  message?: string;
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}
