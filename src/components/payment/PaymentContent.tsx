
import React from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentMethodType } from "./payment.types";
import PaymentStatusMessage from "./PaymentStatusMessage";
import BookingSummary from "./BookingSummary";
import PaymentMethods from "./PaymentMethods";

interface PaymentContentProps {
  bookingDetails: BookingDetails;
  paymentStatus: PaymentStatus;
  errorDetails: APIError | null;
  transactionId: string;
  bookingId: string;
  onCardPayment: () => void;
  onGooglePayment: () => void;
}

const PaymentContent: React.FC<PaymentContentProps> = ({
  bookingDetails,
  paymentStatus,
  errorDetails,
  transactionId,
  bookingId,
  onCardPayment,
  onGooglePayment,
}) => {
  // Show status messages for all states
  if (paymentStatus === 'loading' || paymentStatus === 'processing' || paymentStatus === 'success' || paymentStatus === 'error') {
    return (
      <PaymentStatusMessage 
        status={paymentStatus} 
        errorDetails={errorDetails} 
        transactionId={transactionId}
        bookingId={bookingId}
      />
    );
  }

  // Show booking summary and payment methods for idle state
  return (
    <>
      <div className="space-y-4">
        <BookingSummary bookingDetails={bookingDetails} />
        
        <PaymentMethods 
          onCardPayment={onCardPayment}
          onGooglePayment={onGooglePayment}
          disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
        />
      </div>
      
      <div className="text-xs text-muted-foreground mt-4">
        <p>By proceeding with payment, you agree to our terms and conditions.</p>
        <p className="mt-1">Your payment information is secured with 256-bit encryption.</p>
        <p className="mt-1">Transaction ID: {transactionId || 'Not generated yet'}</p>
      </div>
    </>
  );
};

export default PaymentContent;
