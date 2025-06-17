import { useState, useCallback, useEffect } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { usePaymentIntent } from './usePaymentIntent';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingDetails } from '@/types/hotel.types';
import type { PaymentStatus, PaymentResponse } from './paymentHooks.types';
import type { ProcessBookingParams } from '../../../functions/src/types/booking.process.types';
import { v4 as uuidv4 } from 'uuid';

export const usePaymentProcess = (
  isOpen: boolean,
  bookingDetails: BookingDetails | null,
  onPaymentComplete: () => void
) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [transactionId] = useState(() => uuidv4());
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingToken] = useState(() => uuidv4());
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent } = usePaymentIntent();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Create payment intent when modal opens and we have booking details
  useEffect(() => {
    if (isOpen && bookingDetails && !calculatedAmount) {
      console.log("🔧 usePaymentProcess: Modal opened, creating payment intent...");
      handleCreatePaymentIntent();
    }
  }, [isOpen, bookingDetails]);

  const handleCreatePaymentIntent = async () => {
    if (!bookingDetails) {
      console.error("🔧 usePaymentProcess: No booking details available");
      return;
    }

    try {
      setPaymentStatus('loading');
      setErrorDetails(null);

      console.log("🔧 usePaymentProcess: Creating payment intent with booking data:", {
        rooms: bookingDetails.rooms.map(r => ({ id: r.id, name: r.name, price: r.price })),
        period: bookingDetails.period,
        guests: bookingDetails.guests,
        totalPrice: bookingDetails.totalPrice
      });

      const paymentIntentParams = {
        rooms: bookingDetails.rooms.map(room => ({
          id: room.id,
          name: room.name,
          price: room.price,
          capacity: room.capacity
        })),
        period: {
          checkIn: bookingDetails.period.checkIn.toISOString(),
          checkOut: bookingDetails.period.checkOut.toISOString()
        },
        guests: bookingDetails.guests,
        transaction_id: transactionId,
        booking_reference: `booking-${Date.now()}`,
        currency: 'usd'
      };

      const response = await createPaymentIntent(paymentIntentParams);
      
      console.log("🔧 usePaymentProcess: Payment intent response:", response);
      
      setCalculatedAmount(response.calculatedAmount);
      setPaymentIntentId(response.paymentIntentId);
      setPaymentStatus('ready');
      
    } catch (error: any) {
      console.error("🔧 usePaymentProcess: Failed to create payment intent:", error);
      setErrorDetails(error.message || 'Failed to initialize payment');
      setPaymentStatus('error');
      
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const processPayment = useCallback(async (
    paymentType: 'card' | 'google_pay',
    paymentMethodId: string
  ) => {
    if (!stripe || !elements || !bookingDetails || !paymentIntentId) {
      setErrorDetails('Payment system not ready');
      return;
    }

    console.log("🔧 usePaymentProcess: Processing payment with booking data");
    
    try {
      setPaymentStatus('processing');
      setErrorDetails(null);

      // Confirm the payment intent first
      let confirmResult;
      
      if (paymentType === 'card') {
        const cardElement = elements.getElement('card');
        if (!cardElement) {
          throw new Error('Card element not found');
        }
        
        confirmResult = await stripe.confirmCardPayment(paymentIntentId, {
          payment_method: paymentMethodId
        });
      } else {
        // For Google Pay, the payment method is already created
        confirmResult = await stripe.confirmCardPayment(paymentIntentId, {
          payment_method: paymentMethodId
        });
      }

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message || 'Payment confirmation failed');
      }

      console.log("🔧 usePaymentProcess: Payment confirmed, processing booking...");

      // Process the booking with confirmed payment
      const processBookingFn = httpsCallable<ProcessBookingParams, PaymentResponse>(
        functions,
        'processBooking'
      );

      const bookingParams: ProcessBookingParams = {
        paymentIntentId: confirmResult.paymentIntent.id,
        transaction_id: transactionId,
        userEmail: currentUser?.email || bookingDetails.userEmail || 'guest@example.com',
        userId: currentUser?.uid,
        paymentType,
        paymentMethodId,
        bookingDetails: {
          period: {
            checkIn: bookingDetails.period.checkIn.toISOString(),
            checkOut: bookingDetails.period.checkOut.toISOString()
          },
          guests: bookingDetails.guests,
          rooms: bookingDetails.rooms.map(room => ({
            id: room.id,
            name: room.name,
            price: room.price,
            capacity: room.capacity
          })),
          totalPrice: bookingDetails.totalPrice,
          userEmail: currentUser?.email || bookingDetails.userEmail || 'guest@example.com'
        }
      };

      console.log("🔧 usePaymentProcess: Calling processBooking with:", bookingParams);

      const result = await processBookingFn(bookingParams);
      
      console.log("🔧 usePaymentProcess: Booking processed:", result.data);
      
      if (result.data.success) {
        setBookingId(result.data.bookingId);
        setPaymentStatus('completed');
        
        toast({
          title: "Payment Successful!",
          description: result.data.message,
          variant: "default",
        });
        
        onPaymentComplete();
      } else {
        throw new Error(result.data.message || 'Payment processing failed');
      }
      
    } catch (error: any) {
      console.error("🔧 usePaymentProcess: Payment processing failed:", error);
      setErrorDetails(error.message || 'Payment processing failed');
      setPaymentStatus('error');
      
      toast({
        title: "Payment Failed",
        description: error.message || "Payment could not be processed. Please try again.",
        variant: "destructive",
      });
    }
  }, [stripe, elements, bookingDetails, paymentIntentId, transactionId, currentUser, onPaymentComplete, toast]);

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
