
import { useState, useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentResponse, ProcessBookingData, PaymentMethodType } from "@/components/payment/payment.types";

export const usePaymentProcess = (
  isOpen: boolean,
  bookingDetails: BookingDetails | null,
  onPaymentComplete: () => void
) => {
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

  // Fetch payment intent
  useEffect(() => {
    if (isOpen && bookingDetails) {
      // Generate a unique transaction ID for this booking attempt
      const generatedTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setTransactionId(generatedTransactionId);
      
      setPaymentStatus('loading');
      
      // REPLACE THIS WITH YOUR DEPLOYED FIREBASE CLOUD FUNCTION URL
      const createPaymentIntentUrl = '/api/create-payment-intent';
      
      fetch(createPaymentIntentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: {
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

  const processPayment = async (paymentType: PaymentMethodType, paymentMethodId: string) => {
    setPaymentStatus('processing');
    
    // REPLACE THIS WITH YOUR DEPLOYED FIREBASE CLOUD FUNCTION URL
    const processBookingUrl = '/api/process-booking';
    
    if (!bookingDetails) {
      setPaymentStatus('error');
      setErrorDetails({
        type: 'unknown',
        message: 'Booking details are missing'
      });
      return;
    }

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

  return {
    paymentStatus,
    errorDetails,
    transactionId,
    bookingId,
    processPayment,
  };
};
