
import { useCallback } from 'react';
import { usePaymentIntent } from './usePaymentIntent';
import type { BookingDetails } from '@/types/hotel.types';

export const usePaymentIntentHandler = () => {
  const { createPaymentIntent } = usePaymentIntent();

  const handleCreatePaymentIntent = useCallback(async (
    bookingDetails: BookingDetails,
    transactionId: string
  ) => {
    console.log("🔧 PaymentIntentHandler: Creating payment intent with booking data:", {
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
    
    console.log("🔧 PaymentIntentHandler: Payment intent created:", response);
    
    return response;
  }, [createPaymentIntent]);

  return { handleCreatePaymentIntent };
};
