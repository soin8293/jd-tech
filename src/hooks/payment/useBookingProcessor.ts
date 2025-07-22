
import { useCallback } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingDetails } from '@/types/hotel.types';
import type { PaymentResponse } from './paymentHooks.types';
import type { ProcessBookingParams } from '../../../functions/src/types/booking.process.types';

export const useBookingProcessor = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { currentUser } = useAuth();

  const confirmPayment = useCallback(async (
    paymentType: 'card' | 'google_pay',
    paymentMethodId: string,
    clientSecret: string
  ) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not ready');
    }

    console.log("🔧 BookingProcessor: Confirming payment with Stripe using client secret");

    let confirmResult;
    
    if (paymentType === 'card') {
      const cardElement = elements.getElement('card');
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
      });
    } else {
      confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
      });
    }

    if (confirmResult.error) {
      throw new Error(confirmResult.error.message || 'Payment confirmation failed');
    }

    console.log("🔧 BookingProcessor: Payment confirmed with Stripe");
    return confirmResult.paymentIntent;
  }, [stripe, elements]);

  const processBooking = useCallback(async (
    confirmedPaymentIntent: any,
    bookingDetails: BookingDetails,
    transactionId: string,
    paymentType: 'card' | 'google_pay',
    paymentMethodId: string
  ) => {
    console.log("🔧 BookingProcessor: Processing booking with confirmed payment");

    const processBookingFn = httpsCallable<ProcessBookingParams, PaymentResponse>(
      functions,
      'processBooking'
    );

    const bookingParams: ProcessBookingParams = {
      paymentIntentId: confirmedPaymentIntent.id,
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

    console.log("🔧 BookingProcessor: Calling processBooking with:", bookingParams);

    const result = await processBookingFn(bookingParams);
    
    console.log("🔧 BookingProcessor: Booking processed:", result.data);
    
    if (!result.data.success) {
      throw new Error(result.data.message || 'Payment processing failed');
    }
    
    return result.data;
  }, [currentUser]);

  return {
    confirmPayment,
    processBooking,
  };
};
