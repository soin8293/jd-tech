
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingDetails } from "@/types/hotel.types";
import { usePaymentProcess } from "@/hooks/usePaymentProcess";
import PaymentContent from "./PaymentContent";
import StripeWrapper from "./StripeWrapper";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: BookingDetails | null;
  onPaymentComplete: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingDetails,
  onPaymentComplete,
}) => {
  const {
    paymentStatus,
    errorDetails,
    transactionId,
    bookingId,
    processPayment,
    calculatedAmount,
  } = usePaymentProcess(isOpen, bookingDetails, onPaymentComplete);

  if (!bookingDetails) return null;

  const handleClose = () => {
    if (paymentStatus !== 'loading' && paymentStatus !== 'processing') {
      onClose();
    }
  };

  const handlePayWithCard = async (paymentMethodId: string) => {
    await processPayment('card', paymentMethodId);
  };

  const handleGooglePay = async (paymentMethodId: string) => {
    await processPayment('google_pay', paymentMethodId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            Securely pay for your reservation using your preferred payment method.
          </DialogDescription>
        </DialogHeader>
        
        <StripeWrapper>
          <PaymentContent
            bookingDetails={bookingDetails}
            paymentStatus={paymentStatus}
            errorDetails={errorDetails}
            transactionId={transactionId}
            bookingId={bookingId}
            onCardPayment={handlePayWithCard}
            onGooglePayment={handleGooglePay}
            calculatedAmount={calculatedAmount}
          />
        </StripeWrapper>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
