
export type PaymentStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';

export type PaymentMethodType = 'card' | 'google_pay' | 'apple_pay' | 'bank_transfer';

export interface APIError {
  type: string;
  message: string;
  code?: string;
  param?: string;
}

export interface PaymentResponse {
  success: boolean;
  partial?: boolean;
  bookingId?: string;
  bookingToken?: string;
  paymentStatus?: string;
  message?: string;
  error?: APIError;
  clientSecret?: string;
  paymentIntentId?: string;
  calculatedAmount?: number;
  details?: {
    nights?: number;
    roomCount?: number;
  };
}

export interface ProcessBookingData {
  paymentMethodId: string;
  clientSecret: string;
  paymentIntentId: string;
  bookingDetails: any;
  paymentType: PaymentMethodType;
  timestamp: string;
  transaction_id: string;
  userEmail?: string;
  serverCalculatedAmount?: number | null;
}
