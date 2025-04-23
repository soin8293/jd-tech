
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingDetails } from "@/types/hotel.types";
import { usePaymentProcess } from "@/hooks/usePaymentProcess";
import PaymentContent from "./PaymentContent";
import BookingConfirmationContent from "./BookingConfirmationContent";
import StripeWrapper from "./StripeWrapper";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen && bookingDetails) {
      console.log("PAYMENT_MODAL: Modal opened with booking details:", {
        period: {
          checkIn: bookingDetails.period.checkIn,
          checkOut: bookingDetails.period.checkOut
        },
        rooms: bookingDetails.rooms.map(r => ({
          id: r.id,
          name: r.name,
          price: r.price
        })),
        guests: bookingDetails.guests,
        totalPrice: bookingDetails.totalPrice
      });
    }
  }, [isOpen, bookingDetails]);
  
  const {
    paymentStatus,
    errorDetails,
    transactionId,
    bookingId,
    bookingToken,
    processPayment,
    calculatedAmount,
  } = usePaymentProcess(isOpen, bookingDetails, () => {
    console.log("PAYMENT_MODAL: Payment complete callback triggered");
    setShowConfirmation(true);
    onPaymentComplete();
  });

  useEffect(() => {
    console.log("PAYMENT_MODAL: Payment status changed:", paymentStatus);
    if (errorDetails) {
      console.error("PAYMENT_MODAL: Error details:", errorDetails);
    }
  }, [paymentStatus, errorDetails]);

  if (!bookingDetails) {
    console.error("PAYMENT_MODAL: No booking details provided");
    return null;
  }

  const handleClose = () => {
    console.log("PAYMENT_MODAL: Close button clicked. Payment status:", paymentStatus);
    // Only allow closing if not processing payment or if showing confirmation
    if (paymentStatus !== 'loading' && paymentStatus !== 'processing' || showConfirmation) {
      console.log("PAYMENT_MODAL: Closing modal");
      onClose();
      // Reset the confirmation view when closing
      setTimeout(() => setShowConfirmation(false), 300);
    } else {
      console.log("PAYMENT_MODAL: Cannot close during payment processing");
    }
  };

  const handlePayWithCard = async (paymentMethodId: string) => {
    console.log("PAYMENT_MODAL: Pay with card initiated with payment method ID:", paymentMethodId);
    await processPayment('card', paymentMethodId);
  };

  const handleGooglePay = async (paymentMethodId: string) => {
    console.log("PAYMENT_MODAL: Google Pay initiated with payment method ID:", paymentMethodId);
    await processPayment('google_pay', paymentMethodId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={showConfirmation ? "sm:max-w-md md:max-w-lg" : "sm:max-w-md"}>
        {showConfirmation ? (
          <>
            <div className="absolute right-4 top-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClose}
                className="h-6 w-6 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogHeader>
              <DialogTitle>Booking Confirmation</DialogTitle>
              <DialogDescription>
                Your booking has been successfully confirmed. Please save your booking details.
              </DialogDescription>
            </DialogHeader>
            <BookingConfirmationContent 
              bookingId={bookingId} 
              bookingDetails={bookingDetails}
              transactionId={transactionId}
              bookingToken={bookingToken}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
