
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentResponse, ProcessBookingData } from "./payment.types";
import PaymentStatusMessage from "./PaymentStatusMessage";
import BookingSummary from "./BookingSummary";
import PaymentMethods from "./PaymentMethods";

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
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorDetails, setErrorDetails] = useState<APIError | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setErrorDetails(null);
      setClientSecret('');
      setTransactionId('');
      setBookingId('');
    }
  }, [isOpen]);

  useEffect(() => {
    // Only fetch the payment intent when the modal is open and we have booking details
    if (isOpen && bookingDetails) {
      // Generate a unique transaction ID for this booking attempt
      const generatedTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setTransactionId(generatedTransactionId);
      
      setPaymentStatus('loading');
      
      // REPLACE THIS WITH YOUR DEPLOYED FIREBASE CLOUD FUNCTION URL
      // Example: https://us-central1-your-project-id.cloudfunctions.net/createPaymentIntent
      const createPaymentIntentUrl = '/api/create-payment-intent'; // Replace with your deployed function URL
      
      fetch(createPaymentIntentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: {  // Important: Firebase Cloud Functions expect data in a "data" field
            amount: bookingDetails.totalPrice,
            currency: 'usd',
            booking_reference: `booking-${Date.now()}`,
            transaction_id: generatedTransactionId
          }
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }
          return response.json();
        })
        .then(responseJson => {
          console.log('Firebase Cloud Function createPaymentIntent response:', responseJson);
          // Firebase Functions return data inside a "result" object
          const clientSecret = responseJson.result?.clientSecret;
          if (!clientSecret) {
            throw new Error('Invalid response: Client secret not found');
          }
          setClientSecret(clientSecret);
          setPaymentStatus('idle');
        })
        .catch(error => {
          console.error('Error calling Firebase Cloud Function createPaymentIntent:', error);
          setPaymentStatus('error');
          setErrorDetails({
            type: 'payment_failed',
            message: 'Failed to initialize payment. Please try again later.'
          });
        });
    }
  }, [isOpen, bookingDetails]);

  if (!bookingDetails) return null;

  const handleClose = () => {
    if (paymentStatus !== 'loading' && paymentStatus !== 'processing') {
      onClose();
      setPaymentStatus('idle');
      setErrorDetails(null);
    }
  };

  const processPayment = async (paymentType: 'card' | 'google_pay', paymentMethodId: string) => {
    setPaymentStatus('processing');
    
    // REPLACE THIS WITH YOUR DEPLOYED FIREBASE CLOUD FUNCTION URL
    // Example: https://us-central1-your-project-id.cloudfunctions.net/processBooking
    const processBookingUrl = '/api/process-booking'; // Replace with your deployed function URL
    
    const processBookingData: ProcessBookingData = {
      paymentMethodId,
      clientSecret,
      bookingDetails,
      paymentType,
      timestamp: new Date().toISOString(),
      transaction_id: transactionId
    };

    try {
      const response = await fetch(processBookingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: processBookingData }),
      });
      
      if (!response.ok) {
        const status = response.status;
        // Handle different status codes differently
        if (status === 400) {
          throw new Error('Invalid booking data');
        } else if (status === 402) {
          throw new Error('Payment failed');
        } else if (status === 500) {
          throw new Error('Server error');
        }
        throw new Error('Booking processing failed');
      }
      
      const responseJson = await response.json();
      console.log('Firebase Cloud Function processBooking response:', responseJson);
      
      const result = responseJson.result as PaymentResponse;
      
      if (result.success) {
        setBookingId(result.bookingId || '');
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentComplete();
        }, 1500);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error calling Firebase Cloud Function processBooking:', error);
      setPaymentStatus('error');
      
      // Determine error type based on error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Payment failed')) {
        setErrorDetails({
          type: 'payment_failed',
          message: 'Your payment could not be processed. Please try again or use a different payment method.'
        });
      } else if (errorMessage.includes('booking')) {
        setErrorDetails({
          type: 'booking_failed',
          message: 'Payment was successful, but booking could not be processed. Please contact support.'
        });
      } else {
        setErrorDetails({
          type: 'unknown',
          message: 'An unexpected error occurred. Please try again later.'
        });
      }
    }
  };

  const handlePayWithCard = async () => {
    await processPayment('card', 'dummy_card_payment_id');
  };

  const handleGooglePay = async () => {
    await processPayment('google_pay', 'dummy_googlepay_payment_id');
  };

  const renderContent = () => {
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
            onCardPayment={handlePayWithCard}
            onGooglePayment={handleGooglePay}
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            Securely pay for your reservation using your preferred payment method.
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
