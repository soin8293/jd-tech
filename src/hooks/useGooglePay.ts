
import { useState, useEffect } from "react";
import { useStripe } from "@stripe/react-stripe-js";

export const useGooglePay = (amount: number) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [googlePayError, setGooglePayError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !amount || amount <= 0) {
      console.log("GOOGLE_PAY: Not initializing - stripe:", !!stripe, "amount:", amount);
      return;
    }
    
    console.log("GOOGLE_PAY: Initializing with amount:", amount);
    
    try {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'JD Suites Booking',
          amount: Math.round(amount * 100), // Convert to cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });
      
      console.log("GOOGLE_PAY: Payment request created, checking availability...");
      
      pr.canMakePayment().then(result => {
        console.log("GOOGLE_PAY: canMakePayment result:", result);
        
        if (result) {
          setPaymentRequest(pr);
          setGooglePayAvailable(true);
          setGooglePayError(null);
          console.log("GOOGLE_PAY: Available and ready");
        } else {
          setPaymentRequest(null);
          setGooglePayAvailable(false);
          setGooglePayError("Google Pay is not available in this browser");
          console.log("GOOGLE_PAY: Not available in this browser");
        }
      }).catch(error => {
        console.error("GOOGLE_PAY: Error checking availability:", error);
        setPaymentRequest(null);
        setGooglePayAvailable(false);
        setGooglePayError(error.message || "Google Pay check failed");
      });
      
    } catch (error: any) {
      console.error("GOOGLE_PAY: Error creating payment request:", error);
      setPaymentRequest(null);
      setGooglePayAvailable(false);
      setGooglePayError(error.message || "Google Pay initialization failed");
    }
  }, [stripe, amount]);

  return {
    paymentRequest,
    googlePayAvailable,
    googlePayError
  };
};
