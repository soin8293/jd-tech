
export type PaymentStatus = 'idle' | 'loading' | 'processing' | 'error' | 'success';
export type APIErrorType = 'payment_failed' | 'booking_failed' | 'network_error' | 'unknown';

export interface APIError {
  type: APIErrorType;
  message: string;
}
