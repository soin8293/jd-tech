
import React from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentMethodType } from "./payment.types";
import PaymentStatusMessage from "./PaymentStatusMessage";
import BookingSummary from "./BookingSummary";
import PaymentMethods from "./PaymentMethods";
import { AlertCircle } from "lucide-react";

interface PaymentContentProps {
  bookingDetails: BookingDetails;
  paymentStatus: PaymentStatus;
  errorDetails: APIError | null;
  transactionId: string;
  bookingId: string;
  onCardPayment: (paymentMethodId: string) => void;
  onGooglePayment: (paymentMethodId: string) => void;
  calculatedAmount: number | null;
}

const PaymentContent: React.FC<PaymentContentProps> = ({
  bookingDetails,
  paymentStatus,
  errorDetails,
  transactionId,
  bookingId,
  onCardPayment,
  onGooglePayment,
  calculatedAmount,
}) => {
  // Calculate whether there's a price discrepancy between client and server
  const hasPriceDiscrepancy = calculatedAmount !== null && 
    Math.abs(calculatedAmount - bookingDetails.totalPrice) > 0.01; // Allow for minor rounding differences
  
  // Only show status messages for processing, success, or error states after an attempted payment
  if (paymentStatus === 'processing' || paymentStatus === 'success' || (paymentStatus === 'error' && errorDetails !== null)) {
    return (
      <PaymentStatusMessage 
        status={paymentStatus} 
        errorDetails={errorDetails} 
        transactionId={transactionId}
        bookingId={bookingId}
      />
    );
  }

  // Show booking summary and payment methods for idle and loading states
  return (
    <>
      <div className="space-y-4">
        <BookingSummary 
          bookingDetails={bookingDetails} 
          serverCalculatedAmount={calculatedAmount}
        />
        
        {hasPriceDiscrepancy && (
          <div className="bg-amber-50 p-3 rounded-md flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800">Price discrepancy detected</p>
              <p className="text-amber-600 text-xs">
                There was a difference between your calculated price (${bookingDetails.totalPrice}) and 
                our server calculation (${calculatedAmount}). We will use the server calculation for billing.
              </p>
            </div>
          </div>
        )}
        
        <PaymentMethods 
          onCardPayment={onCardPayment}
          onGooglePayment={onGooglePayment}
          disabled={paymentStatus === 'loading'}
          amount={calculatedAmount !== null ? calculatedAmount : bookingDetails.totalPrice}
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
