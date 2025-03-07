
import React from "react";
import { AlertTriangle, Check, Loader } from "lucide-react";
import { PaymentStatus, APIError } from "./payment.types";

interface PaymentStatusMessageProps {
  status: PaymentStatus;
  errorDetails: APIError | null;
  transactionId: string;
  bookingId?: string;
}

const PaymentStatusMessage: React.FC<PaymentStatusMessageProps> = ({
  status,
  errorDetails,
  transactionId,
  bookingId
}) => {
  if (status === 'loading' || status === 'processing') {
    return (
      <div className="bg-secondary/50 p-4 rounded-md text-center my-4 flex flex-col items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm font-medium">
          {status === 'loading' ? 'Initializing payment...' : 'Processing your payment...'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Please don't close this window.</p>
      </div>
    );
  }

  if (status === 'error' && errorDetails) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md flex items-start gap-3 my-4">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">
            {errorDetails.type === 'payment_failed' ? 'Payment Failed' : 
             errorDetails.type === 'booking_failed' ? 'Booking Failed' : 'Error'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {errorDetails.message || "There was an error processing your payment. Please try again."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Transaction ID: {transactionId}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 p-4 rounded-md flex items-start gap-3 my-4">
        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-600">Payment Successful!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your booking has been confirmed.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Booking ID: {bookingId || 'Processing...'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Transaction ID: {transactionId}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentStatusMessage;
