
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
              },
            },
            hidePostalCode: true,
          }}
          onChange={onCardElementChange}
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
  );
};

export default CardPaymentForm;
