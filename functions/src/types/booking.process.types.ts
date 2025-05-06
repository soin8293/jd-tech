
import { BookingPeriod, Room } from "../types/booking.types";

// Define our own BookingData type since it's not exported from booking.types
export interface BookingData {
  period: BookingPeriod;
  guests: number;
  rooms: Room[];
  totalPrice: number;
  userEmail?: string;
  contactPhone?: string;
  specialRequests?: string;
}

export interface ProcessBookingData {
  paymentMethodId: string;
  clientSecret: string;
  paymentType: string;
  transaction_id: string;
  paymentIntentId: string;
  bookingDetails: BookingData;
  serverCalculatedAmount?: number;
  timestamp?: string;
  userEmail?: string;
  userId?: string; // Added to support user ID tracking
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
