
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
      console.log("🚀 PAYMENT_INTENT: Starting payment intent creation");
      console.log("🚀 PAYMENT_INTENT: Modal opened:", isOpen);
      console.log("🚀 PAYMENT_INTENT: Booking details:", {
        period: {
          checkIn: bookingDetails.period.checkIn,
          checkOut: bookingDetails.period.checkOut
        },
        guests: bookingDetails.guests,
        roomCount: bookingDetails.rooms.length,
        totalPrice: bookingDetails.totalPrice
      });
      
      setIsLoading(true);
      
      const generatedTransactionId = generateTransactionId();
      console.log("🚀 PAYMENT_INTENT: Generated transaction ID:", generatedTransactionId);
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
      
      console.log("🚀 PAYMENT_INTENT: Calling createPaymentIntent with data:", paymentData);
      console.log("🚀 PAYMENT_INTENT: Function reference:", createPaymentIntentFunction);
      
      createPaymentIntentFunction(paymentData)
        .then((result) => {
          console.log("✅ PAYMENT_INTENT: Successfully received response from createPaymentIntent");
          console.log("✅ PAYMENT_INTENT: Raw result:", result);
          console.log("✅ PAYMENT_INTENT: Result data:", result.data);
          
          const responseData = result.data as PaymentResponse;
          console.log("✅ PAYMENT_INTENT: Parsed response data:", responseData);
          
          if (responseData.clientSecret) {
            console.log("✅ PAYMENT_INTENT: Client secret received, length:", responseData.clientSecret.length);
            setClientSecret(responseData.clientSecret);
            setPaymentIntentId(responseData.paymentIntentId || '');
            if (responseData.calculatedAmount) {
              console.log("✅ PAYMENT_INTENT: Server calculated amount:", responseData.calculatedAmount);
              setCalculatedAmount(responseData.calculatedAmount);
            }
            setIsLoading(false);
            setError(null);
            console.log("✅ PAYMENT_INTENT: Payment intent setup completed successfully");
          } else {
            console.error("❌ PAYMENT_INTENT: No client secret in response");
            throw new Error("Invalid response received from createPaymentIntent");
          }
        })
        .catch((error: any) => {
          console.error("❌ PAYMENT_INTENT: Error calling createPaymentIntent function");
          console.error("❌ PAYMENT_INTENT: Error occurred at:", new Date().toISOString());
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
