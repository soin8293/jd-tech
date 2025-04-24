
import { BookingDetails } from "../types/booking.types";

export interface ProcessBookingData {
  paymentMethodId: string;
  clientSecret: string;
  paymentType: string;
  transaction_id: string;
  paymentIntentId: string;
  bookingDetails: BookingDetails;
  serverCalculatedAmount?: number;
  timestamp?: string;
  userEmail?: string;
  userId?: string; // Added to support user ID tracking
}

export interface PaymentResponse {
  success: boolean;
  partial?: boolean;
  bookingId?: string;
  paymentStatus?: string;
  message?: string;
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}
