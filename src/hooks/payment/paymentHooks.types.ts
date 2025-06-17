
import { BookingDetails } from "@/types/hotel.types";

export type PaymentStatus = 'idle' | 'loading' | 'processing' | 'completed' | 'ready' | 'error';

export type PaymentMethodType = 'card' | 'google_pay' | 'apple_pay' | 'bank_transfer';

export interface APIError {
  type: string;
  message: string;
  code?: string;
  param?: string;
}

export interface Room {
  id: string;
  name: string;
  price: number;
  capacity: number;
}

export interface BookingPeriod {
  checkIn: string | Date;
  checkOut: string | Date;
}

export interface CreatePaymentIntentParams {
  rooms: Room[];
  period: BookingPeriod;
  guests: number;
  transaction_id?: string;
  booking_reference?: string;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret?: string;
  paymentIntentId: string;
  calculatedAmount: number;
  details: {
    nights: number;
    roomCount: number;
  };
}

export interface ProcessBookingParams {
  paymentIntentId: string;
  transaction_id: string;
  userEmail: string;
  paymentType: PaymentMethodType;
  bookingDetails: {
    period: BookingPeriod;
    guests: number;
    rooms: Room[];
    totalPrice: number;
    userEmail: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  partial?: boolean;
  bookingId?: string;
  bookingToken?: string;
  paymentStatus?: string;
  message?: string;
  error?: APIError;
}

export interface PaymentHookState {
  paymentStatus: PaymentStatus;
  errorDetails: APIError | null;
  clientSecret: string;
  paymentIntentId: string;
  transactionId: string;
  bookingId: string;
  bookingToken: string;
  calculatedAmount: number | null;
}

export interface PaymentProcessProps {
  isOpen: boolean;
  bookingDetails: BookingDetails | null;
  onPaymentComplete: () => void;
}

export interface UsePaymentProcessReturn {
  paymentStatus: PaymentStatus;
  errorDetails: APIError | null;
  transactionId: string;
  bookingId: string;
  bookingToken: string;
  processPayment: (paymentType: PaymentMethodType, paymentMethodId: string) => Promise<void>;
  calculatedAmount: number | null;
}
