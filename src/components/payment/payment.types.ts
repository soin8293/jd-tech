
import { BookingDetails } from '@/types/hotel.types';

export type PaymentStatus = 'idle' | 'loading' | 'processing' | 'error' | 'success';
export type APIErrorType = 'payment_failed' | 'booking_failed' | 'network_error' | 'unknown' | 'validation_error' | 'system_error';
export type PaymentMethodType = 'card' | 'google_pay';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface APIError {
  type: APIErrorType;
  message: string;
}

export interface PaymentResponse {
  success: boolean;
  bookingId?: string;
  paymentStatus?: string;
  message?: string;
  error?: APIError;
}

export interface ProcessBookingData {
  paymentMethodId: string;
  clientSecret: string;
  paymentIntentId: string; // Added for payment verification
  bookingDetails: BookingDetails;
  paymentType: PaymentMethodType;
  timestamp: string;
  transaction_id: string;
  serverCalculatedAmount?: number;
}
