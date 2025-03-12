
import React from "react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Using a test publishable key here - this is safe to include in client-side code
const stripePromise = loadStripe('pk_test_51QyqmqPpAASNRvfwCEGudrz2PKWIZL2QFZomDQtGIRR4orWge75Sk7oCNLnUmmJJ86AJUAi6vgBmh6FEhDMRaiXH00L7cKRv7H');

interface StripeWrapperProps {
  children: React.ReactNode;
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  const options = {
    appearance: {
      theme: 'stripe',
    },
    // Enable Google Pay if available
    payment_request: {
      country: 'US',
      currency: 'usd',
      // These other options will be set in the PaymentMethods component
    },
  };
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeWrapper;
