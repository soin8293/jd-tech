
import { useState, useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentResponse, ProcessBookingData, PaymentMethodType } from "@/components/payment/payment.types";
import { API_ENDPOINTS } from "@/config/api";

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
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setErrorDetails(null);
      setClientSecret('');
      setTransactionId('');
      setBookingId('');
      setCalculatedAmount(null);
    }
  }, [isOpen]);

  // Generate transaction ID when modal opens but don't set error state
  useEffect(() => {
    if (isOpen && bookingDetails) {
      // Generate a unique transaction ID for this booking attempt
      const generatedTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setTransactionId(generatedTransactionId);
      
      // Prepare the booking data to send to the Cloud Function
      const bookingData = {
        rooms: bookingDetails.rooms,
        period: bookingDetails.period,
        guests: bookingDetails.guests,
        currency: 'usd',
        booking_reference: `booking-${Date.now()}`,
        transaction_id: generatedTransactionId
      };
      
      // Call the Firebase Cloud Function to create a payment intent
      fetch(API_ENDPOINTS.CREATE_PAYMENT_INTENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: bookingData
        }),
      })
        .then(response => {
          if (!response.ok) {
            console.log('Payment intent initialization failed, but not showing error yet');
            return null;
          }
          return response.json();
        })
        .then(responseJson => {
          if (responseJson) {
            console.log('Firebase Cloud Function createPaymentIntent response:', responseJson);
            // Firebase Functions return data inside a "result" object
            const clientSecret = responseJson.result?.clientSecret;
            const serverCalculatedAmount = responseJson.result?.calculatedAmount;
            
            if (clientSecret) {
              setClientSecret(clientSecret);
              
              // Use the server-calculated amount as the source of truth
              if (serverCalculatedAmount) {
                setCalculatedAmount(serverCalculatedAmount);
              }
            }
          }
        })
        .catch(error => {
          console.error('Error calling Firebase Cloud Function createPaymentIntent:', error);
          // Don't set error state here, wait until user attempts payment
        });
    }
  }, [isOpen, bookingDetails]);

  const processPayment = async (paymentType: PaymentMethodType, paymentMethodId: string) => {
    // Only set processing state when user actually selects a payment method
    setPaymentStatus('processing');
    
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

    // Always use the server-calculated amount as the source of truth
    if (calculatedAmount !== null) {
      processBookingData.serverCalculatedAmount = calculatedAmount;
    }

    try {
      const response = await fetch(API_ENDPOINTS.PROCESS_BOOKING, {
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
    calculatedAmount,
  };
};
