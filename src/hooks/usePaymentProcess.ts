
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
      
      // Mock successful payment intent initialization
      setTimeout(() => {
        const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setPaymentIntentId(mockPaymentIntentId);
        setClientSecret('mock_client_secret');
        
        // Calculate the total amount from booking details
        if (bookingDetails?.rooms) {
          const nights = Math.floor((
            bookingDetails.period.checkOut.getTime() - 
            bookingDetails.period.checkIn.getTime()
          ) / (1000 * 60 * 60 * 24));
          
          const totalAmount = bookingDetails.rooms.reduce(
            (sum, room) => sum + (room.price * nights), 
            0
          );
          
          setCalculatedAmount(totalAmount);
        }
        
        setPaymentStatus('idle');
        console.log("Mock payment intent created:", mockPaymentIntentId);
      }, 1000);
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

    console.log(`Processing ${paymentType} payment with payment method ID: ${paymentMethodId}`);
    
    // Mock payment processing with a delay
    setTimeout(() => {
      const mockBookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setBookingId(mockBookingId);
      setPaymentStatus('success');
      
      // Show success toast
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed!",
      });
      
      // Notify parent component after a short delay
      setTimeout(() => {
        onPaymentComplete();
      }, 1500);
    }, 2000);
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
