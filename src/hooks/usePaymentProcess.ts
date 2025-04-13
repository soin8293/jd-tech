
import { useState, useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentResponse, ProcessBookingData, PaymentMethodType } from "@/components/payment/payment.types";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "@/hooks/use-toast";

export const usePaymentProcess = (
  isOpen: boolean,
  bookingDetails: BookingDetails | null,
  onPaymentComplete: () => void
) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorDetails, setErrorDetails] = useState<APIError | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setErrorDetails(null);
      setClientSecret('');
      setPaymentIntentId('');
      setTransactionId('');
      setBookingId('');
      setCalculatedAmount(null);
    }
  }, [isOpen]);

  // Generate transaction ID and initialize payment intent when modal opens
  useEffect(() => {
    if (isOpen && bookingDetails) {
      // Set loading state while initializing payment
      setPaymentStatus('loading');
      
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
            console.error('Payment intent initialization failed:', response.status, response.statusText);
            throw new Error('Failed to initialize payment. Please try again.');
          }
          return response.json();
        })
        .then(responseJson => {
          if (responseJson && responseJson.result) {
            console.log('Firebase Cloud Function createPaymentIntent response:', responseJson);
            // Firebase Functions return data inside a "result" object
            const clientSecret = responseJson.result?.clientSecret;
            const paymentIntentId = responseJson.result?.paymentIntentId;
            const serverCalculatedAmount = responseJson.result?.calculatedAmount;
            
            if (clientSecret && paymentIntentId) {
              setClientSecret(clientSecret);
              setPaymentIntentId(paymentIntentId);
              
              // Use the server-calculated amount as the source of truth
              if (serverCalculatedAmount) {
                setCalculatedAmount(serverCalculatedAmount);
              }
              
              // Return to idle state once payment is initialized
              setPaymentStatus('idle');
            } else {
              throw new Error('Invalid response from payment service. Missing payment data.');
            }
          } else {
            throw new Error('Invalid response from payment service.');
          }
        })
        .catch(error => {
          console.error('Error calling Firebase Cloud Function createPaymentIntent:', error);
          setPaymentStatus('error');
          setErrorDetails({
            type: 'network_error',
            message: error.message || 'Failed to initialize payment. Please try again later.'
          });
          
          // Show error toast
          toast({
            title: "Payment Initialization Failed",
            description: error.message || "Could not initialize payment. Please try again.",
            variant: "destructive",
          });
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

    // Ensure we have a payment intent ID
    if (!paymentIntentId || !clientSecret) {
      setPaymentStatus('error');
      setErrorDetails({
        type: 'unknown',
        message: 'Payment initialization failed. Please try again.'
      });
      return;
    }

    const processBookingData: ProcessBookingData = {
      paymentMethodId,
      clientSecret,
      paymentIntentId, // Include payment intent ID for verification
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
      // Show processing toast for better UX
      toast({
        title: "Processing Payment",
        description: "Please wait while we process your payment...",
      });
      
      const response = await fetch(API_ENDPOINTS.PROCESS_BOOKING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: processBookingData }),
      });
      
      if (!response.ok) {
        const status = response.status;
        const responseData = await response.json();
        const errorMessage = responseData?.error?.message || responseData?.message;
        
        // Handle different status codes differently
        if (status === 400) {
          throw new Error(errorMessage || 'Invalid booking data');
        } else if (status === 402) {
          throw new Error(errorMessage || 'Payment failed');
        } else if (status === 500) {
          throw new Error(errorMessage || 'Server error');
        }
        throw new Error(errorMessage || 'Booking processing failed');
      }
      
      const responseJson = await response.json();
      console.log('Firebase Cloud Function processBooking response:', responseJson);
      
      const result = responseJson.result as PaymentResponse;
      
      if (result.success) {
        setBookingId(result.bookingId || '');
        setPaymentStatus('success');
        
        // Show success toast
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });
        
        setTimeout(() => {
          onPaymentComplete();
        }, 1500);
      } else {
        // Handle partial success (payment succeeded but booking storage failed)
        if (result.partial) {
          setBookingId(result.bookingId || '');
          setPaymentStatus('success');
          
          toast({
            title: "Payment Successful",
            description: "Payment processed, but there was an issue saving your booking. Please contact support with your transaction ID.",
            variant: "destructive",
          });
          
          setTimeout(() => {
            onPaymentComplete();
          }, 1500);
        } else {
          throw new Error(result.error?.message || result.message || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error calling Firebase Cloud Function processBooking:', error);
      setPaymentStatus('error');
      
      // Determine error type based on error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Payment failed') || errorMessage.includes('card')) {
        setErrorDetails({
          type: 'payment_failed',
          message: 'Your payment could not be processed. Please try again or use a different payment method.'
        });
      } else if (errorMessage.includes('booking')) {
        setErrorDetails({
          type: 'booking_failed',
          message: 'Payment was successful, but booking could not be processed. Please contact support.'
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setErrorDetails({
          type: 'network_error',
          message: 'A network error occurred. Please check your connection and try again.'
        });
      } else {
        setErrorDetails({
          type: 'unknown',
          message: 'An unexpected error occurred. Please try again later.'
        });
      }
      
      // Show error toast
      toast({
        title: "Payment Failed",
        description: errorMessage || "Could not process your payment. Please try again.",
        variant: "destructive",
      });
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
