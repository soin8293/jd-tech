
import { BookingDetails } from "./booking.types";

export interface ProcessBookingData {
  paymentMethodId: string;
  clientSecret: string;
  paymentType: string;
  transaction_id: string;
  paymentIntentId: string;
  bookingDetails: BookingDetails;
  serverCalculatedAmount?: number;
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
  };
}
