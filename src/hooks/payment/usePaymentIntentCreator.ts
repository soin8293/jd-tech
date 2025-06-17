
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentResponse } from "@/components/payment/payment.types";

export const usePaymentIntentCreator = () => {
  const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');

  const createPaymentIntent = async (bookingDetails: BookingDetails, transactionId: string) => {
    const paymentData = {
      rooms: bookingDetails.rooms,
      period: {
        checkIn: bookingDetails.period.checkIn.toISOString(),
        checkOut: bookingDetails.period.checkOut.toISOString()
      },
      guests: bookingDetails.guests,
      transaction_id: transactionId,
      currency: 'usd'
    };
    
    console.log("FRONTEND: Calling createPaymentIntent via httpsCallable with data:", paymentData);
    
    const result = await createPaymentIntentFunction(paymentData);
    const responseData = result.data as PaymentResponse;
    
    console.log("FRONTEND: Successfully received response from createPaymentIntent:", responseData);
    
    if (!responseData.clientSecret) {
      throw new Error("Invalid response received from createPaymentIntent");
    }
    
    return responseData;
  };

  return { createPaymentIntent };
};
