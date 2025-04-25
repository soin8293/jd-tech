import { useState, useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentStatus, APIError, PaymentResponse, ProcessBookingData, PaymentMethodType } from "@/components/payment/payment.types";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
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
  const [bookingToken, setBookingToken] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

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

  const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
  const processBookingFunction = httpsCallable(functions, 'processBooking');

  useEffect(() => {
    if (isOpen && bookingDetails) {
      setPaymentStatus('loading');
      
      const generatedTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setTransactionId(generatedTransactionId);
      
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
      
      console.log("FRONTEND: Calling createPaymentIntent via httpsCallable with data:", paymentData);
      
      createPaymentIntentFunction(paymentData)
        .then((result) => {
          const responseData = result.data as PaymentResponse;
          console.log("FRONTEND: Successfully received response from createPaymentIntent:", responseData);
          
          if (responseData.clientSecret) {
            setClientSecret(responseData.clientSecret);
            setPaymentIntentId(responseData.paymentIntentId || '');
            if (responseData.calculatedAmount) {
              setCalculatedAmount(responseData.calculatedAmount);
            }
            setPaymentStatus('idle');
          } else {
            throw new Error("Invalid response received from createPaymentIntent");
          }
        })
        .catch((error: any) => {
          console.error("FRONTEND: Error calling createPaymentIntent function:", error);
          console.error("FRONTEND: Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
          
          setPaymentStatus('error');
          setErrorDetails({
            type: error.details?.type || error.code || 'unknown',
            message: error.message || "Failed to initiate payment"
          });
          
          toast({
            title: "Payment Error",
            description: error.message || "Failed to initiate payment",
            variant: "destructive",
          });
        });
    }
  }, [isOpen, bookingDetails]);

  const processPayment = async (paymentType: PaymentMethodType, paymentMethodId: string) => {
    console.log("FRONTEND: Starting payment processing with method:", paymentType);
    
    if (!bookingDetails || !clientSecret || !paymentIntentId) {
      console.error("FRONTEND: Missing required payment information", {
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
    
    setPaymentStatus('processing');
    
    try {
      const bookingData: ProcessBookingData = {
        paymentMethodId,
        clientSecret,
        paymentIntentId,
        bookingDetails,
        paymentType,
        timestamp: new Date().toISOString(),
        transaction_id: transactionId,
        userEmail: localStorage.getItem('userEmail') || 'guest@example.com',
        serverCalculatedAmount: calculatedAmount
      };
      
      console.log("FRONTEND: Calling processBooking with data:", {
        ...bookingData,
        clientSecret: "present (masked for security)",
      });
      
      const result = await processBookingFunction(bookingData);
      const response = result.data as PaymentResponse;
      
      console.log("FRONTEND: Received processBooking response:", response);
      
      if (response.success) {
        setBookingId(response.bookingId || '');
        setBookingToken(response.bookingToken || '');
        setPaymentStatus('success');
        
        console.log("FRONTEND: Payment successful, booking created:", {
          bookingId: response.bookingId,
          hasToken: !!response.bookingToken
        });
        
        if (response.bookingId) {
          localStorage.setItem('lastBookingId', response.bookingId);
          if (response.bookingToken) {
            localStorage.setItem('lastBookingToken', response.bookingToken);
          }
        }
        
        toast({
          title: "Payment Successful",
          description: response.message || "Your booking has been confirmed!",
        });
        
        setTimeout(() => {
          console.log("FRONTEND: Triggering onPaymentComplete callback");
          onPaymentComplete();
        }, 500);
      } else {
        setPaymentStatus('error');
        setErrorDetails(response.error || {
          type: 'unknown',
          message: 'Payment failed. Please try again.'
        });
        
        console.error("FRONTEND: Payment failed with error:", response.error);
        
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
