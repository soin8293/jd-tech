
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingDetails } from "@/types/hotel.types";
import { usePaymentProcess } from "@/hooks/payment";
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

  if (!bookingDetails) {
    console.error("PAYMENT_MODAL: No booking details provided");
    return null;
  }

  console.log("PAYMENT_MODAL: Rendering payment modal, showConfirmation:", showConfirmation);

  const handleClose = () => {
    console.log("PAYMENT_MODAL: Close button clicked");
    onClose();
    // Reset the confirmation view when closing
    setTimeout(() => setShowConfirmation(false), 300);
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
              bookingId="" 
              bookingDetails={bookingDetails}
              transactionId=""
              bookingToken=""
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
              <PaymentModalContent
                bookingDetails={bookingDetails}
                onPaymentComplete={() => {
                  console.log("PAYMENT_MODAL: Payment complete callback triggered");
                  setShowConfirmation(true);
                  onPaymentComplete();
                }}
              />
            </StripeWrapper>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Separate component that uses Stripe hooks - must be inside StripeWrapper
const PaymentModalContent: React.FC<{
  bookingDetails: BookingDetails;
  onPaymentComplete: () => void;
}> = ({ bookingDetails, onPaymentComplete }) => {
  const {
    paymentStatus,
    errorDetails,
    transactionId,
    bookingId,
    bookingToken,
    processPayment,
    calculatedAmount,
  } = usePaymentProcess(true, bookingDetails, onPaymentComplete);

  useEffect(() => {
    console.log("PAYMENT_MODAL_CONTENT: Payment status changed:", paymentStatus);
    if (errorDetails) {
      console.error("PAYMENT_MODAL_CONTENT: Error details:", errorDetails);
    }
  }, [paymentStatus, errorDetails]);

  const handlePayWithCard = async (paymentMethodId: string) => {
    console.log("PAYMENT_MODAL_CONTENT: Pay with card initiated with payment method ID:", paymentMethodId);
    await processPayment('card', paymentMethodId);
  };

  const handleGooglePay = async (paymentMethodId: string) => {
    console.log("PAYMENT_MODAL_CONTENT: Google Pay initiated with payment method ID:", paymentMethodId);
    await processPayment('google_pay', paymentMethodId);
  };

  // Convert payment status and error details to match component types
  const componentPaymentStatus = paymentStatus === 'completed' ? 'success' : paymentStatus;
  const componentErrorDetails = typeof errorDetails === 'string' 
    ? { type: 'unknown', message: errorDetails } 
    : errorDetails;

  return (
    <PaymentContent
      bookingDetails={bookingDetails}
      paymentStatus={componentPaymentStatus}
      errorDetails={componentErrorDetails}
      transactionId={transactionId}
      bookingId={bookingId}
      onCardPayment={handlePayWithCard}
      onGooglePayment={handleGooglePay}
      calculatedAmount={calculatedAmount}
    />
  );
};

export default PaymentModal;
