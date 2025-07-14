
import { useCallback } from 'react';
import { usePaymentIntentCreator } from './usePaymentIntentCreator';
import type { BookingDetails } from '@/types/hotel.types';

export const usePaymentIntentHandler = () => {
  const { createPaymentIntent } = usePaymentIntentCreator();

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

    const response = await createPaymentIntent(bookingDetails, transactionId);
    
    console.log("🔧 PaymentIntentHandler: Payment intent created:", response);
    
    return response;
  }, [createPaymentIntent]);

  return { handleCreatePaymentIntent };
};
