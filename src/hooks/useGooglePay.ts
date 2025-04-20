
import { useState, useEffect } from "react";
import { useStripe } from "@stripe/react-stripe-js";

export const useGooglePay = (amount: number) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [googlePayError, setGooglePayError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !amount) return;
    
    try {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'JD Suites Booking',
          amount: Math.round(amount * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });
      
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          setGooglePayAvailable(true);
          setGooglePayError(null);
        } else {
          setGooglePayAvailable(false);
          setGooglePayError("Google Pay is not available in this browser");
        }
      });
      
    } catch (error: any) {
      setGooglePayAvailable(false);
      setGooglePayError(error.message);
    }
  }, [stripe, amount]);

  return {
    paymentRequest,
    googlePayAvailable,
    googlePayError
  };
};
