
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
      console.log("🚀 PAYMENT_INTENT: ================ ULTRA DETAILED PAYMENT INTENT CREATION ================");
      console.log("🚀 PAYMENT_INTENT: Timestamp:", new Date().toISOString());
      console.log("🚀 PAYMENT_INTENT: Modal opened:", isOpen);
      console.log("🚀 PAYMENT_INTENT: User agent:", navigator.userAgent);
      console.log("🚀 PAYMENT_INTENT: Current URL:", window.location.href);
      console.log("🚀 PAYMENT_INTENT: Origin:", window.location.origin);
      console.log("🚀 PAYMENT_INTENT: Protocol:", window.location.protocol);
      console.log("🚀 PAYMENT_INTENT: Host:", window.location.host);
      
      console.log("🚀 PAYMENT_INTENT: Booking details FULL OBJECT:", JSON.stringify(bookingDetails, null, 2));
      console.log("🚀 PAYMENT_INTENT: Booking details analysis:", {
        hasBookingDetails: !!bookingDetails,
        hasPeriod: !!bookingDetails?.period,
        hasCheckIn: !!bookingDetails?.period?.checkIn,
        hasCheckOut: !!bookingDetails?.period?.checkOut,
        checkInType: typeof bookingDetails?.period?.checkIn,
        checkOutType: typeof bookingDetails?.period?.checkOut,
        checkInValue: bookingDetails?.period?.checkIn,
        checkOutValue: bookingDetails?.period?.checkOut,
        hasRooms: !!bookingDetails?.rooms,
        roomsLength: bookingDetails?.rooms?.length || 0,
        rooms: bookingDetails?.rooms?.map(r => ({
          id: r.id,
          name: r.name,
          price: r.price,
          capacity: r.capacity
        })) || [],
        guests: bookingDetails?.guests,
        totalPrice: bookingDetails?.totalPrice,
        totalPriceType: typeof bookingDetails?.totalPrice
      });
      
      setIsLoading(true);
      setError(null);
      setClientSecret('');
      setPaymentIntentId('');
      setCalculatedAmount(null);
      
      const generatedTransactionId = generateTransactionId();
      console.log("🚀 PAYMENT_INTENT: Generated transaction ID:", generatedTransactionId);
      console.log("🚀 PAYMENT_INTENT: Transaction ID length:", generatedTransactionId.length);
      console.log("🚀 PAYMENT_INTENT: Transaction ID pattern test:", /^txn_\d+_[a-z0-9]+$/.test(generatedTransactionId));
      setTransactionId(generatedTransactionId);
      
      // Validate dates before sending
      const checkInDate = bookingDetails.period.checkIn;
      const checkOutDate = bookingDetails.period.checkOut;
      console.log("🚀 PAYMENT_INTENT: Date validation:", {
        checkInIsDate: checkInDate instanceof Date,
        checkOutIsDate: checkOutDate instanceof Date,
        checkInValid: checkInDate instanceof Date && !isNaN(checkInDate.getTime()),
        checkOutValid: checkOutDate instanceof Date && !isNaN(checkOutDate.getTime()),
        checkInISO: checkInDate instanceof Date ? checkInDate.toISOString() : 'Invalid Date',
        checkOutISO: checkOutDate instanceof Date ? checkOutDate.toISOString() : 'Invalid Date'
      });
      
      const paymentData = {
        rooms: bookingDetails.rooms,
        period: {
          checkIn: checkInDate instanceof Date ? checkInDate.toISOString() : checkInDate,
          checkOut: checkOutDate instanceof Date ? checkOutDate.toISOString() : checkOutDate
        },
        guests: bookingDetails.guests,
        transaction_id: generatedTransactionId,
        currency: 'usd'
      };
      
      console.log("🚀 PAYMENT_INTENT: Payment data prepared:", JSON.stringify(paymentData, null, 2));
      console.log("🚀 PAYMENT_INTENT: Payment data size (bytes):", JSON.stringify(paymentData).length);
      console.log("🚀 PAYMENT_INTENT: Function reference:", createPaymentIntentFunction);
      console.log("🚀 PAYMENT_INTENT: Function reference type:", typeof createPaymentIntentFunction);
      console.log("🚀 PAYMENT_INTENT: Function reference name:", createPaymentIntentFunction?.name);
      
      console.log("🚀 PAYMENT_INTENT: About to call createPaymentIntent...");
      console.log("🚀 PAYMENT_INTENT: Call timestamp:", new Date().toISOString());
      
      createPaymentIntentFunction(paymentData)
        .then((result) => {
          console.log("✅ PAYMENT_INTENT: ================ FUNCTION CALL SUCCESSFUL ================");
          console.log("✅ PAYMENT_INTENT: Success timestamp:", new Date().toISOString());
          console.log("✅ PAYMENT_INTENT: Raw result type:", typeof result);
          console.log("✅ PAYMENT_INTENT: Raw result constructor:", result?.constructor?.name);
          console.log("✅ PAYMENT_INTENT: Raw result keys:", Object.keys(result || {}));
          console.log("✅ PAYMENT_INTENT: Raw result:", JSON.stringify(result, null, 2));
          
          console.log("✅ PAYMENT_INTENT: Result.data type:", typeof result?.data);
          console.log("✅ PAYMENT_INTENT: Result.data constructor:", result?.data?.constructor?.name);
          console.log("✅ PAYMENT_INTENT: Result.data keys:", Object.keys(result?.data || {}));
          console.log("✅ PAYMENT_INTENT: Result.data:", JSON.stringify(result.data, null, 2));
          
          const responseData = result.data as PaymentResponse;
          console.log("✅ PAYMENT_INTENT: Parsed response data:", JSON.stringify(responseData, null, 2));
          
          if (responseData?.clientSecret) {
            console.log("✅ PAYMENT_INTENT: Client secret analysis:", {
              exists: !!responseData.clientSecret,
              type: typeof responseData.clientSecret,
              length: responseData.clientSecret.length,
              startsWithPi: responseData.clientSecret.startsWith('pi_'),
              pattern: /^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/.test(responseData.clientSecret)
            });
            
            setClientSecret(responseData.clientSecret);
            setPaymentIntentId(responseData.paymentIntentId || '');
            
            if (responseData.calculatedAmount) {
              console.log("✅ PAYMENT_INTENT: Server calculated amount analysis:", {
                amount: responseData.calculatedAmount,
                type: typeof responseData.calculatedAmount,
                isNumber: typeof responseData.calculatedAmount === 'number',
                isPositive: responseData.calculatedAmount > 0,
                clientAmount: bookingDetails.totalPrice,
                difference: Math.abs(responseData.calculatedAmount - bookingDetails.totalPrice)
              });
              setCalculatedAmount(responseData.calculatedAmount);
            }
            
            setIsLoading(false);
            setError(null);
            console.log("✅ PAYMENT_INTENT: Payment intent setup completed successfully");
            console.log("✅ PAYMENT_INTENT: Final state:", {
              hasClientSecret: !!responseData.clientSecret,
              hasPaymentIntentId: !!responseData.paymentIntentId,
              hasCalculatedAmount: !!responseData.calculatedAmount,
              isLoading: false,
              hasError: false
            });
          } else {
            console.error("❌ PAYMENT_INTENT: No client secret in response");
            console.error("❌ PAYMENT_INTENT: Response structure analysis:", {
              hasData: !!result?.data,
              dataKeys: Object.keys(result?.data || {}),
              clientSecretValue: responseData?.clientSecret,
              clientSecretType: typeof responseData?.clientSecret
            });
            throw new Error("Invalid response received from createPaymentIntent - no client secret");
          }
        })
        .catch((error: any) => {
          console.error("❌ PAYMENT_INTENT: ================ FUNCTION CALL FAILED ================");
          console.error("❌ PAYMENT_INTENT: Error timestamp:", new Date().toISOString());
          console.error("❌ PAYMENT_INTENT: Error occurred during createPaymentIntent call");
          console.error("❌ PAYMENT_INTENT: Error analysis:", {
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            errorName: error?.name,
            errorMessage: error?.message,
            errorCode: error?.code,
            errorDetails: error?.details,
            errorCause: error?.cause,
            errorStack: error?.stack,
            hasCustomData: !!error?.customData,
            customData: error?.customData
          });
          
          console.error("❌ PAYMENT_INTENT: Full error object:", error);
          console.error("❌ PAYMENT_INTENT: Error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
          console.error("❌ PAYMENT_INTENT: Error string representation:", String(error));
          console.error("❌ PAYMENT_INTENT: Error valueOf:", error?.valueOf?.());
          
          // Check for specific Firebase error patterns
          if (error?.code === 'functions/internal') {
            console.error("❌ PAYMENT_INTENT: FIREBASE FUNCTIONS INTERNAL ERROR DETECTED");
            console.error("❌ PAYMENT_INTENT: This usually means:");
            console.error("❌ PAYMENT_INTENT:   1. Function crashed during execution");
            console.error("❌ PAYMENT_INTENT:   2. Function timeout (>60s for HTTP)");
            console.error("❌ PAYMENT_INTENT:   3. Uncaught exception in function code");
            console.error("❌ PAYMENT_INTENT:   4. Memory limit exceeded");
            console.error("❌ PAYMENT_INTENT:   5. Function not properly deployed");
          }
          
          if (error?.code === 'functions/not-found') {
            console.error("❌ PAYMENT_INTENT: FUNCTION NOT FOUND ERROR");
            console.error("❌ PAYMENT_INTENT: Function 'createPaymentIntent' doesn't exist or isn't deployed");
          }
          
          if (error?.code === 'functions/permission-denied') {
            console.error("❌ PAYMENT_INTENT: PERMISSION DENIED ERROR");
            console.error("❌ PAYMENT_INTENT: User doesn't have permission to call this function");
          }
          
          setIsLoading(false);
          setError(error);
          const processedError = handlePaymentError(error);
          console.error("❌ PAYMENT_INTENT: Processed error for UI:", processedError);
        });
    } else {
      console.log("🚀 PAYMENT_INTENT: Skipping payment intent creation:", {
        modalOpen: isOpen,
        hasBookingDetails: !!bookingDetails,
        reason: !isOpen ? "Modal not open" : "No booking details"
      });
    }
  }, [isOpen, bookingDetails]);

  console.log("🚀 PAYMENT_INTENT: Hook returning state:", {
    hasClientSecret: !!clientSecret,
    hasPaymentIntentId: !!paymentIntentId,
    hasTransactionId: !!transactionId,
    calculatedAmount,
    isLoading,
    hasError: !!error
  });

  return {
    clientSecret,
    paymentIntentId,
    transactionId,
    calculatedAmount,
    isLoading,
    error
  };
};
