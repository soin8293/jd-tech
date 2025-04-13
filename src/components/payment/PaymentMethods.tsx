
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { CardElement, useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { toast } from "@/hooks/use-toast";

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
  
  // Set up Google Pay payment request on component mount
  useEffect(() => {
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
          setGooglePayAvailable(true);
          setGooglePayError(null);
        } else {
          setGooglePayAvailable(false);
          setGooglePayError("Google Pay is not available in this browser");
          console.log("Google Pay is not available in this browser");
        }
      }).catch(error => {
        console.error("Error checking Google Pay availability:", error);
        setGooglePayAvailable(false);
        setGooglePayError(`Error checking Google Pay: ${error.message}`);
      });
      
      // Handle payment method creation
      pr.on('paymentmethod', async (e) => {
        console.log("Google Pay payment method created:", e.paymentMethod.id);
        try {
          setProcessing(true);
          onGooglePayment(e.paymentMethod.id);
          e.complete('success');
        } catch (error) {
          console.error("Error processing Google Pay payment:", error);
          e.complete('fail');
          
          toast({
            title: "Google Pay Error",
            description: error.message || "Failed to process Google Pay payment",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Error setting up Google Pay:", error);
      setGooglePayAvailable(false);
      setGooglePayError(`Error setting up Google Pay: ${error.message}`);
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
        console.error('[card error]', error);
        setCardError(error.message || "Your card was declined");
        setProcessing(false);
        return;
      }
      
      if (!paymentMethod || !paymentMethod.id) {
        setCardError("Failed to process your card. Please try again.");
        setProcessing(false);
        return;
      }
      
      // Card payment method created successfully
      console.log("Card payment method created:", paymentMethod.id);
      onCardPayment(paymentMethod.id);
      
    } catch (error) {
      console.error("Unexpected error processing card payment:", error);
      setCardError("An unexpected error occurred. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
      
      {/* Google Pay Button */}
      {googlePayAvailable && paymentRequest ? (
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
                hidePostalCode: true,
              }}
              onChange={(e) => {
                if (e.error) {
                  setCardError(e.error.message || "Invalid card details");
                } else {
                  setCardError(null);
                }
              }}
            />
          </div>
          
          {cardError && (
            <div className="text-sm text-destructive">{cardError}</div>
          )}
          
          <Button 
            type="submit"
            className="w-full"
            disabled={disabled || processing || !stripe}
          >
            {processing ? 'Processing...' : 'Pay Now'}
          </Button>
        </form>
      )}
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p className="flex items-center justify-center">
          <span>Secure payment powered by Stripe</span>
          <svg className="h-4 w-auto ml-1" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
            <path d="M59.64 14.28h-8.06v-1.83h8.06v1.83zm0-3.67h-8.06V8.79h8.06v1.82zm-8.06 5.5h8.06v1.83h-8.06v-1.83zm-31.11-2.7c-.28.72-.7 1.28-1.3 1.7-.6.4-1.32.6-2.2.6-.5 0-.94-.08-1.35-.24-.4-.16-.75-.39-1.04-.69-.29-.3-.5-.65-.68-1.06a4 4 0 01-.23-1.4V9.1c0-.54.07-1.03.22-1.48.15-.45.38-.84.69-1.17.3-.33.68-.59 1.12-.77a4.6 4.6 0 013.47.05c.42.22.77.55 1.05.99.28.43.47.96.58 1.58l-2.08.17c-.05-.36-.2-.64-.45-.84-.25-.2-.55-.3-.93-.3-.35 0-.63.09-.85.26a1.5 1.5 0 00-.46.7c-.1.29-.15.6-.17.94-.02.33-.03.66-.03.97v1.15c0 .3.01.6.05.89.04.29.1.55.2.78.09.23.22.42.39.55.17.13.39.2.64.2.16 0 .31-.02.45-.07.14-.05.26-.11.36-.2.1-.09.19-.19.24-.31.06-.12.1-.26.1-.4v-.93h-1.31v-1.57h3.48v6.17H21l-.31-.91h-.04c-.13.22-.3.4-.5.55-.22.16-.45.27-.7.34a3.36 3.36 0 01-1.65.08 1.8 1.8 0 01-.71-.32 1.66 1.66 0 01-.5-.6 2.18 2.18 0 01-.18-.93v-.09c0-.37.08-.69.24-.95.16-.26.4-.47.7-.64.31-.16.68-.28 1.1-.36.44-.08.92-.14 1.45-.16v-.22c0-.27-.07-.47-.2-.59a.77.77 0 00-.55-.19c-.22 0-.44.05-.66.15-.22.1-.4.24-.57.44l-1.05-1.15c.3-.3.65-.52 1.07-.68a3.94 3.94 0 012.95.05c.38.18.7.43.93.76.23.33.34.72.34 1.17v3.73h-1.78v-.55h-.03a1.55 1.55 0 01-.57.46c-.22.11-.45.16-.68.16-.53 0-.94-.17-1.23-.52-.3-.35-.45-.83-.45-1.46v-.05c0-.28.04-.53.13-.75.09-.22.22-.4.39-.56a2.8 2.8 0 01.68-.37c.27-.1.58-.15.92-.15h.96v-.32c0-.14-.05-.25-.14-.33-.1-.08-.22-.12-.38-.12-.14 0-.27.03-.38.1-.11.07-.23.16-.35.29l-1.22-1.14c.19-.2.38-.35.58-.48.2-.12.4-.22.6-.28.21-.07.42-.11.64-.13.22-.02.45-.03.7-.03.42 0 .8.06 1.12.17.32.11.6.26.82.46.23.2.4.44.5.72a2.57 2.57 0 01.2 1.03v3.2h-1.73v-.45zm-.37-1.35c0-.1-.03-.18-.08-.26a.55.55 0 00-.25-.16 1.18 1.18 0 00-.42-.06h-.23v1.55c.14 0 .28 0 .4-.03.13-.02.24-.06.33-.12.09-.06.16-.13.2-.22a.72.72 0 00.05-.32v-.38zm14-2.9h-4.21v1.89h4.22v-1.9zm-4.55-5.5c.2-.36.45-.66.76-.9.31-.24.67-.42 1.06-.53a5.18 5.18 0 012.56-.2c.39.09.73.24 1.03.45.3.2.57.45.78.75l-1.2 1.35c-.28-.33-.61-.49-.98-.49-.38 0-.7.1-.98.3-.27.2-.47.48-.6.85-.12.36-.18.79-.18 1.26v.18c0 .47.06.9.18 1.27.12.37.32.66.59.87.28.21.62.32 1.03.32a2.25 2.25 0 001.6-.68l1.11 1.4c-.19.2-.4.37-.63.5-.23.13-.47.23-.72.3a6.48 6.48 0 01-1.44.15c-.44 0-.88-.07-1.33-.2a3.38 3.38 0 01-1.76-1.37 4.52 4.52 0 01-.67-2.58V8.94c0-.48.1-.93.29-1.33zm-2.4.21c.28-.33.62-.59 1.03-.76a3.3 3.3 0 011.3-.27c.87 0 1.55.32 2.02.97l.23-.8h1.82v8.39h-2.13v-.8l-.2.3c-.2.2-.43.35-.71.46-.28.1-.58.16-.89.16-.42 0-.8-.09-1.14-.26-.35-.17-.65-.42-.9-.74a3.65 3.65 0 01-.58-1.13 5.43 5.43 0 01-.21-1.54V8.92c0-.5.12-.97.36-1.4zm2.13 1.15a1.4 1.4 0 00-.45.46c-.11.2-.2.43-.25.7a4.05 4.05 0 00-.09.94v.21c0 .36.03.7.1 1.02.06.32.16.6.3.83.13.24.3.43.51.57.2.14.45.2.74.2.18 0 .34-.03.48-.08.14-.06.26-.12.36-.22.1-.09.18-.18.25-.29.06-.1.1-.21.12-.32V8.02a.92.92 0 00-.27-.29 1.11 1.11 0 00-.43-.17 2.2 2.2 0 00-.4-.04c-.22 0-.4.04-.55.13-.15.08-.29.2-.42.35zM12.32 6.7a1.6 1.6 0 00-.92-.27c-.19 0-.37.03-.54.1-.16.06-.31.15-.44.27a1.57 1.57 0 00-.44.6 2.3 2.3 0 00-.05 1.75c.1.2.25.37.44.51.2.13.42.2.69.2a1.59 1.59 0 001.26-.6v.86h2.13V.28h-2.13v6.42zM4.09 12.6c-.34-.56-.5-1.24-.5-2.03V8.9c0-.8.16-1.48.5-2.04.33-.57.81-1 1.43-1.29a5.25 5.25 0 012.14-.43c.8 0 1.5.14 2.15.43.64.28 1.11.71 1.44 1.29.34.56.5 1.25.5 2.04v1.67c0 .8-.16 1.47-.5 2.03-.33.57-.8 1-1.44 1.29-.64.29-1.35.43-2.15.43-.79 0-1.5-.14-2.14-.43a3.21 3.21 0 01-1.43-1.29zm2.54-.76c.13.16.3.28.52.36.22.08.46.13.72.13a1.9 1.9 0 001.24-.49c.15-.16.27-.35.35-.59.09-.23.13-.5.13-.8V8.81c0-.3-.04-.56-.13-.8a1.43 1.43 0 00-.35-.58c-.16-.16-.33-.28-.52-.36a1.56 1.56 0 00-.72-.13c-.26 0-.5.05-.72.13-.22.08-.4.2-.52.36a1.43 1.43 0 00-.36.59c-.08.23-.12.5-.12.8v1.63c0 .3.04.57.12.8.09.24.2.43.36.59z" fill="#6772E5"/>
          </svg>
        </p>
      </div>
    </div>
  );
};

export default PaymentMethods;
