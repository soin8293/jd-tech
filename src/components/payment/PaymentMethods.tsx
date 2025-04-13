
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { CardElement, useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";

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
  const [googlePayError, setGooglePayError] = useState<string | null>(null);
  
  // Set up Google Pay payment request on component mount
  React.useEffect(() => {
    if (!stripe || !amount) return;
    
    console.log("Setting up Google Pay payment request for amount:", amount);
    
    try {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'JD Suites Booking',
          amount: Math.round(amount * 100), // Convert to cents for Stripe and ensure it's an integer
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });
      
      // Check if the Payment Request is available
      pr.canMakePayment().then(result => {
        console.log("Google Pay availability check result:", result);
        if (result) {
          setPaymentRequest(pr);
          setGooglePayError(null);
        } else {
          setGooglePayError("Google Pay is not available in this browser");
          console.log("Google Pay is not available in this browser");
        }
      }).catch(error => {
        console.error("Error checking Google Pay availability:", error);
        setGooglePayError(`Error checking Google Pay: ${error.message}`);
      });
      
      // Handle payment method creation
      pr.on('paymentmethod', async (e) => {
        console.log("Google Pay payment method created:", e.paymentMethod.id);
        setProcessing(true);
        onGooglePayment(e.paymentMethod.id);
        e.complete('success');
      });
    } catch (error) {
      console.error("Error setting up Google Pay:", error);
      setGooglePayError(`Error setting up Google Pay: ${error.message}`);
    }
    
  }, [stripe, amount, onGooglePayment]);

  const handleCardClick = () => {
    setShowCardElement(true);
  };

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setProcessing(false);
      return;
    }
    
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });
    
    if (error) {
      console.error('[error]', error);
      setProcessing(false);
    } else {
      onCardPayment(paymentMethod.id);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
      
      {/* Google Pay Button */}
      {paymentRequest ? (
        <div className="mb-3">
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: 'buy', // Valid values are 'default', 'book', 'buy', etc.
                  theme: 'light',
                  height: '48px',
                },
              },
            }}
          />
        </div>
      ) : (
        <Button 
          variant="outline" 
          className="w-full h-12 mb-3 flex items-center justify-center"
          disabled={true}
        >
          <svg viewBox="0 0 41 17" className="h-6 w-auto">
            <path d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.62-1.488-.62h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.665-1.559.996-2.583.996h-2.485v.001zM27.194 10.442c0 .392.166.718.499.98.332.26.722.391 1.168.391.633 0 1.196-.234 1.692-.701.497-.469.744-1.019.744-1.65-.469-.37-1.123-.555-1.962-.555-.61 0-1.12.148-1.528.442-.409.294-.613.657-.613 1.093m1.946-5.815c1.112 0 1.989.297 2.633.89.642.594.964 1.408.964 2.442v4.932h-1.439v-1.11h-.065c-.622.914-1.45 1.372-2.486 1.372-.882 0-1.621-.262-2.215-.784-.594-.523-.891-1.176-.891-1.96 0-.828.313-1.486.94-1.976s1.463-.735 2.51-.735c.892 0 1.629.163 2.206.49v-.344c0-.522-.207-.966-.621-1.33a2.132 2.132 0 0 0-1.455-.547c-.84 0-1.504.353-1.995 1.059l-1.324-.828c.73-1.045 1.81-1.568 3.238-1.568M40.993 4.889l-5.02 11.53H34.42l1.864-4.034-3.302-7.496h1.635l2.387 5.749h.032l2.322-5.75z" fill="#4285F4"></path>
            <path d="M13.448 7.134c0-.473-.04-.93-.116-1.366H6.988v2.588h3.634a3.11 3.11 0 0 1-1.344 2.042v1.68h2.169c1.27-1.17 2.001-2.9 2.001-4.944" fill="#4285F4"></path>
            <path d="M6.988 13.7c1.816 0 3.344-.595 4.459-1.621l-2.169-1.681c-.603.406-1.38.643-2.29.643-1.754 0-3.244-1.182-3.776-2.774H.978v1.731a6.728 6.728 0 0 0 6.01 3.703" fill="#34A853"></path>
            <path d="M3.212 8.267a4.034 4.034 0 0 1 0-2.572V3.964H.978A6.678 6.678 0 0 0 .261 6.98c0 1.085.26 2.11.717 3.017l2.234-1.731z" fill="#FABB05"></path>
            <path d="M6.988 2.921c.992 0 1.88.34 2.58 1.008v.001l1.92-1.918C10.324.928 8.804.262 6.989.262a6.728 6.728 0 0 0-6.01 3.702l2.234 1.731c.532-1.592 2.022-2.774 3.776-2.774" fill="#E94235"></path>
          </svg>
          <span className="ml-2">
            {googlePayError || "Google Pay not available"}
          </span>
        </Button>
      )}
      
      {/* Card Payment Button */}
      {!showCardElement && (
        <Button 
          variant="default" 
          className="w-full h-12 mb-3"
          onClick={handleCardClick}
          disabled={disabled}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay with Card
        </Button>
      )}
      
      {/* Stripe Card Element */}
      {showCardElement && (
        <form onSubmit={handleCardSubmit} className="space-y-4">
          <div className="p-4 border border-border rounded-md">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    '::placeholder': {
                      color: '#6b7280',
                    },
                  },
                },
              }}
            />
          </div>
          <Button 
            type="submit"
            className="w-full"
            disabled={disabled || processing || !stripe}
          >
            {processing ? 'Processing...' : 'Pay Now'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default PaymentMethods;
