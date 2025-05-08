
import { useState, useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentResponse } from "@/components/payment/payment.types";
import { toast } from "@/hooks/use-toast";
import { createPaymentIntentFunction, generateTransactionId, handlePaymentError } from "./paymentUtils";

export const usePaymentIntent = (isOpen: boolean, bookingDetails: BookingDetails | null) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (isOpen && bookingDetails) {
      setIsLoading(true);
      
      const generatedTransactionId = generateTransactionId();
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
            setIsLoading(false);
            setError(null);
          } else {
            throw new Error("Invalid response received from createPaymentIntent");
          }
        })
        .catch((error: any) => {
          setIsLoading(false);
          setError(error);
          handlePaymentError(error);
        });
    }
  }, [isOpen, bookingDetails]);

  return {
    clientSecret,
    paymentIntentId,
    transactionId,
    calculatedAmount,
    isLoading,
    error
  };
};
