
import { useState, useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentResponse, ProcessBookingData, PaymentMethodType } from "@/components/payment/payment.types";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { httpsCallable, getFunctions } from "firebase/functions";
import { functions } from "@/lib/firebase";

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
  const [bookingToken, setBookingToken] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      console.log("PAYMENT_PROCESS: Modal opened, resetting payment state");
      setPaymentStatus('idle');
      setErrorDetails(null);
      setClientSecret('');
      setPaymentIntentId('');
      setTransactionId('');
      setBookingId('');
      setBookingToken('');
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
      console.log("PAYMENT_PROCESS: Generated transaction ID:", generatedTransactionId);
      
      // Call the Firebase Cloud Function to create a payment intent
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      
      const paymentData = {
        rooms: bookingDetails.rooms,
        period: {
          checkIn: bookingDetails.period.checkIn.toISOString(),
          checkOut: bookingDetails.period.checkOut.toISOString()
        },
        guests: bookingDetails.guests,
        transaction_id: generatedTransactionId,
        currency: 'usd'
      };
      
      console.log("FRONTEND: Attempting to call createPaymentIntent with data:", paymentData);
      
      createPaymentIntent(paymentData)
        .then((result: any) => {
          const data = result.data;
          console.log("FRONTEND: Successfully received response from createPaymentIntent:", data);
          
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
          setCalculatedAmount(data.calculatedAmount);
          setPaymentStatus('idle');
          
          console.log("FRONTEND: Payment intent created and state updated:", {
            clientSecret: data.clientSecret ? "present (masked)" : "missing",
            paymentIntentId: data.paymentIntentId,
            calculatedAmount: data.calculatedAmount
          });
        })
        .catch((error) => {
          console.error("FRONTEND: Error calling createPaymentIntent function:", error);
          console.error("FRONTEND: Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
          
          setErrorDetails({
            type: error.details?.type || 'unknown',
            message: error.message || "Failed to initialize payment"
          });
          setPaymentStatus('error');
          
          console.error("FRONTEND: Payment process state set to error:", {
            errorType: error.details?.type || 'unknown',
            errorMessage: error.message || "Failed to initialize payment"
          });
        });
    }
  }, [isOpen, bookingDetails]);

  const processPayment = async (paymentType: PaymentMethodType, paymentMethodId: string) => {
    console.log("PAYMENT_PROCESS: Starting payment processing with method:", paymentType);
    
    if (!bookingDetails || !clientSecret || !paymentIntentId) {
      console.error("PAYMENT_PROCESS: Missing required payment information:", {
        hasBookingDetails: !!bookingDetails,
        hasClientSecret: !!clientSecret,
        hasPaymentIntentId: !!paymentIntentId
      });
      
      setPaymentStatus('error');
      setErrorDetails({
        type: 'unknown',
        message: 'Missing required payment information'
      });
      return;
    }
    
    // Set processing state
    setPaymentStatus('processing');
    console.log("PAYMENT_PROCESS: Payment status set to 'processing'");
    
    try {
      // Call the Firebase Cloud Function to process the booking
      const processBooking = httpsCallable(functions, 'processBooking');
      
      // Get stored user email from localStorage or use a default
      const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
      
      const bookingData: ProcessBookingData = {
        paymentMethodId: paymentMethodId,
        clientSecret: clientSecret,
        paymentIntentId: paymentIntentId,
        bookingDetails: {
          ...bookingDetails,
          userEmail // Add the userEmail to the booking details
        },
        paymentType: paymentType,
        timestamp: new Date().toISOString(),
        transaction_id: transactionId,
        serverCalculatedAmount: calculatedAmount
      };
      
      console.log("FRONTEND: Calling processBooking with data:", {
        ...bookingData,
        clientSecret: "present (masked for security)",
        bookingDetails: {
          ...bookingData.bookingDetails,
          rooms: `${bookingData.bookingDetails.rooms.length} rooms selected`
        }
      });
      
      const result = await processBooking(bookingData);
      const response = result.data as PaymentResponse;
      
      console.log("FRONTEND: Received processBooking response:", response);
      
      if (response.success) {
        setBookingId(response.bookingId || '');
        setBookingToken(response.bookingToken || '');
        setPaymentStatus('success');
        
        console.log("PAYMENT_PROCESS: Payment successful, booking created:", {
          bookingId: response.bookingId,
          hasToken: !!response.bookingToken
        });
        
        // Store booking info in local storage for later access
        if (response.bookingId) {
          localStorage.setItem('lastBookingId', response.bookingId);
          
          if (response.bookingToken) {
            localStorage.setItem('lastBookingToken', response.bookingToken);
          }
        }
        
        // Show success toast
        toast({
          title: "Payment Successful",
          description: response.message || "Your booking has been confirmed!",
        });
        
        // Notify parent component after a short delay
        setTimeout(() => {
          console.log("PAYMENT_PROCESS: Triggering onPaymentComplete callback");
          onPaymentComplete();
        }, 500);
      } else {
        setPaymentStatus('error');
        setErrorDetails(response.error || {
          type: 'unknown',
          message: 'Payment failed. Please try again.'
        });
        
        console.error("PAYMENT_PROCESS: Payment failed with error:", response.error);
        
        // Show error toast
        toast({
          title: "Payment Failed",
          description: response.error?.message || "There was a problem with your payment",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("FRONTEND: Error processing payment:", error);
      console.error("FRONTEND: Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      setPaymentStatus('error');
      setErrorDetails({
        type: error.details?.type || 'unknown',
        message: error.message || "Failed to process payment"
      });
      
      // Show error toast
      toast({
        title: "Payment Error",
        description: error.message || "There was a problem with your payment",
        variant: "destructive",
      });
    }
  };

  return {
    paymentStatus,
    errorDetails,
    transactionId,
    bookingId,
    bookingToken,
    processPayment,
    calculatedAmount,
  };
};
