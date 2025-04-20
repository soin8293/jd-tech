
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
      
      createPaymentIntent(paymentData)
        .then((result: any) => {
          const data = result.data;
          console.log("Payment intent created:", data);
          
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
          setCalculatedAmount(data.calculatedAmount);
          setPaymentStatus('idle');
        })
        .catch((error) => {
          console.error("Error creating payment intent:", error);
          setErrorDetails({
            type: error.details?.type || 'unknown',
            message: error.message || "Failed to initialize payment"
          });
          setPaymentStatus('error');
        });
    }
  }, [isOpen, bookingDetails]);

  const processPayment = async (paymentType: PaymentMethodType, paymentMethodId: string) => {
    if (!bookingDetails || !clientSecret || !paymentIntentId) {
      setPaymentStatus('error');
      setErrorDetails({
        type: 'unknown',
        message: 'Missing required payment information'
      });
      return;
    }
    
    // Set processing state
    setPaymentStatus('processing');
    
    try {
      // Call the Firebase Cloud Function to process the booking
      const processBooking = httpsCallable(functions, 'processBooking');
      
      const bookingData: ProcessBookingData = {
        paymentMethodId: paymentMethodId,
        clientSecret: clientSecret,
        paymentIntentId: paymentIntentId,
        bookingDetails: {
          ...bookingDetails,
          userEmail: localStorage.getItem('userEmail') || 'guest@example.com' // Store user email for confirmation
        },
        paymentType: paymentType,
        timestamp: new Date().toISOString(),
        transaction_id: transactionId,
        serverCalculatedAmount: calculatedAmount
      };
      
      console.log("Processing payment with data:", bookingData);
      
      const result = await processBooking(bookingData);
      const response = result.data as PaymentResponse;
      
      if (response.success) {
        setBookingId(response.bookingId || '');
        setPaymentStatus('success');
        
        // Show success toast
        toast({
          title: "Payment Successful",
          description: response.message || "Your booking has been confirmed!",
        });
        
        // Notify parent component after a short delay
        setTimeout(() => {
          onPaymentComplete();
        }, 2000);
      } else {
        setPaymentStatus('error');
        setErrorDetails(response.error || {
          type: 'unknown',
          message: 'Payment failed. Please try again.'
        });
        
        // Show error toast
        toast({
          title: "Payment Failed",
          description: response.error?.message || "There was a problem with your payment",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
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
    processPayment,
    calculatedAmount,
  };
};
