
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentMethodType, ProcessBookingData, PaymentResponse } from "@/components/payment/payment.types";

export const usePaymentProcessor = () => {
  const processBookingFunction = httpsCallable(functions, 'processBooking');

  const processPayment = async (
    paymentMethodId: string,
    clientSecret: string,
    paymentIntentId: string,
    bookingDetails: BookingDetails,
    paymentType: PaymentMethodType,
    transactionId: string,
    calculatedAmount: number | null
  ) => {
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
    
    return response;
  };

  return { processPayment };
};
