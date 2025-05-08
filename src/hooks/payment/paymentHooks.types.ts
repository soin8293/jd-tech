
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentMethodType } from "@/components/payment/payment.types";

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
