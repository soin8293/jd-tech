
import React, { useState, useEffect } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import PaymentMethodTypes from "./PaymentMethodTypes";
import CardPaymentForm from "./CardPaymentForm";
import PaymentFooter from "./PaymentFooter";
import { useGooglePay } from "@/hooks/useGooglePay";
import { createCardPayment } from "@/utils/paymentProcessor";

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
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  
  const { paymentRequest, googlePayAvailable, googlePayError } = useGooglePay(amount);

  useEffect(() => {
    if (paymentRequest) {
      console.log("PAYMENT_METHODS: Setting up Google Pay event handler");
      
      const handlePaymentMethod = async (e: any) => {
        try {
          console.log("PAYMENT_METHODS: Google Pay payment method received:", e.paymentMethod.id);
          setProcessing(true);
          await onGooglePayment(e.paymentMethod.id);
          e.complete('success');
          console.log("PAYMENT_METHODS: Google Pay payment completed successfully");
        } catch (error: any) {
          console.error("PAYMENT_METHODS: Google Pay payment failed:", error);
          e.complete('fail');
          setCardError(error.message || "Failed to process Google Pay payment");
        } finally {
          setProcessing(false);
        }
      };

      paymentRequest.on('paymentmethod', handlePaymentMethod);

      // Cleanup function to remove event listener
      return () => {
        paymentRequest.off('paymentmethod', handlePaymentMethod);
      };
    }
  }, [paymentRequest, onGooglePayment]);

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || processing || disabled) {
      console.log("PAYMENT_METHODS: Card payment blocked - stripe:", !!stripe, "elements:", !!elements, "processing:", processing, "disabled:", disabled);
      return;
    }

    console.log("PAYMENT_METHODS: Starting card payment process");
    setProcessing(true);
    setCardError(null);
    
    try {
      const paymentMethodId = await createCardPayment(stripe, elements);
      console.log("PAYMENT_METHODS: Card payment method created:", paymentMethodId);
      await onCardPayment(paymentMethodId);
      console.log("PAYMENT_METHODS: Card payment completed successfully");
    } catch (error: any) {
      console.error("PAYMENT_METHODS: Card payment failed:", error);
      setCardError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCardClick = () => {
    console.log("PAYMENT_METHODS: Card payment option selected");
    setShowCardElement(true);
    setCardError(null);
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
        disabled={disabled || processing}
      />
      
      {showCardElement && (
        <CardPaymentForm
          onSubmit={handleCardSubmit}
          cardError={cardError}
          disabled={disabled || processing}
          processing={processing}
          stripe={!!stripe}
          onCardElementChange={(e) => {
            if (e.error) {
              console.log("PAYMENT_METHODS: Card element error:", e.error.message);
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
