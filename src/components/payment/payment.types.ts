
export type PaymentStatus = 'idle' | 'loading' | 'processing' | 'error' | 'success';
export type APIErrorType = 'payment_failed' | 'booking_failed' | 'network_error' | 'unknown';
export type PaymentMethodType = 'card' | 'google_pay';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface APIError {
  type: APIErrorType;
  message: string;
}

export interface PaymentResponse {
  success: boolean;
  bookingId?: string;
  message?: string;
  error?: APIError;
}

export interface ProcessBookingData {
  paymentMethodId: string;
  clientSecret: string;
  bookingDetails: any; // Use your BookingDetails type
  paymentType: PaymentMethodType;
  timestamp: string;
  transaction_id: string;
}
