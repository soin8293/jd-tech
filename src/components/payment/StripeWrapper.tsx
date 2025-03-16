
import React from "react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeElementsOptions } from "@stripe/stripe-js";

// Using a test publishable key here - this is safe to include in client-side code
const stripePromise = loadStripe('pk_test_51QyqmqPpAASNRvfwCEGudrz2PKWIZL2QFZomDQtGIRR4orWge75Sk7oCNLnUmmJJ86AJUAi6vgBmh6FEhDMRaiXH00L7cKRv7H');

interface StripeWrapperProps {
  children: React.ReactNode;
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
  };
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeWrapper;
