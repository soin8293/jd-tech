
import React from "react";
import { Button } from "@/components/ui/button";
import { CardElement } from "@stripe/react-stripe-js";

interface CardPaymentFormProps {
  onSubmit: (event: React.FormEvent) => void;
  cardError: string | null;
  disabled: boolean;
  processing: boolean;
  stripe: boolean;
  onCardElementChange: (e: any) => void;
}

const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  onSubmit,
  cardError,
  disabled,
  processing,
  stripe,
  onCardElementChange,
}) => {
  console.log("CARD_FORM: Rendering with processing:", processing, "disabled:", disabled, "stripe:", stripe);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
                fontFamily: 'system-ui, sans-serif',
              },
              invalid: {
                color: '#ef4444',
              },
            },
            hidePostalCode: false,
          }}
          onChange={onCardElementChange}
        />
      </div>
      
      {cardError && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {cardError}
        </div>
      )}
      
      <Button 
        type="submit"
        className="w-full h-12"
        disabled={disabled || processing || !stripe}
      >
        {processing ? 'Processing Payment...' : 'Pay Now'}
      </Button>
    </form>
  );
};

export default CardPaymentForm;
