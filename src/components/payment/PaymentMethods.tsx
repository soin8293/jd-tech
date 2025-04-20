
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
      paymentRequest.on('paymentmethod', async (e: any) => {
        try {
          setProcessing(true);
          onGooglePayment(e.paymentMethod.id);
          e.complete('success');
        } catch (error: any) {
          e.complete('fail');
          setCardError(error.message || "Failed to process Google Pay payment");
        }
      });
    }
  }, [paymentRequest, onGooglePayment]);

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setCardError(null);
    
    try {
      const paymentMethodId = await createCardPayment(stripe, elements);
      onCardPayment(paymentMethodId);
    } catch (error: any) {
      setCardError(error.message);
      setProcessing(false);
    }
  };

  const handleCardClick = () => {
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
