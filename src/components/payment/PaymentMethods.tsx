
import React, { useState, useEffect } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import PaymentMethodTypes from "./PaymentMethodTypes";
import CardPaymentForm from "./CardPaymentForm";
import PaymentFooter from "./PaymentFooter";

interface PaymentMethodsProps {
  onCardPayment: (paymentMethodId: string) => void;
  onGooglePayment: (paymentMethodId: string) => void;
  disabled: boolean;
  amount: number;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  onCardPayment,
  onGooglePayment,
  disabled,
  amount
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [showCardElement, setShowCardElement] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [googlePayError, setGooglePayError] = useState<string | null>(null);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  // Set up Google Pay payment request
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
      
      pr.on('paymentmethod', async (e) => {
        try {
          setProcessing(true);
          onGooglePayment(e.paymentMethod.id);
          e.complete('success');
        } catch (error: any) {
          e.complete('fail');
          setGooglePayError(error.message || "Failed to process Google Pay payment");
        }
      });
    } catch (error: any) {
      setGooglePayAvailable(false);
      setGooglePayError(error.message);
    }
  }, [stripe, amount, onGooglePayment]);

  const handleCardClick = () => {
    setShowCardElement(true);
    setCardError(null);
  };

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setCardError("Stripe has not initialized yet. Please try again.");
      return;
    }
    
    setProcessing(true);
    setCardError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setCardError("Card information is missing. Please refresh and try again.");
      setProcessing(false);
      return;
    }
    
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error) {
        setCardError(error.message || "Your card was declined");
        setProcessing(false);
        return;
      }
      
      if (!paymentMethod || !paymentMethod.id) {
        setCardError("Failed to process your card. Please try again.");
        setProcessing(false);
        return;
      }
      
      onCardPayment(paymentMethod.id);
      
    } catch (error: any) {
      setCardError(error.message || "An unexpected error occurred. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
      
      <PaymentMethodTypes
        googlePayAvailable={googlePayAvailable}
        googlePayError={googlePayError}
        paymentRequest={paymentRequest}
        onCardClick={handleCardClick}
        showCardElement={showCardElement}
        disabled={disabled}
      />
      
      {showCardElement && (
        <CardPaymentForm
          onSubmit={handleCardSubmit}
          cardError={cardError}
          disabled={disabled}
          processing={processing}
          stripe={!!stripe}
          onCardElementChange={(e) => {
            if (e.error) {
              setCardError(e.error.message || "Invalid card details");
            } else {
              setCardError(null);
            }
          }}
        />
      )}
      
      <PaymentFooter />
    </div>
  );
};

export default PaymentMethods;
