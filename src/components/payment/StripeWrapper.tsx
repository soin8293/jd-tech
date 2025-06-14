
import React from "react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeElementsOptions } from "@stripe/stripe-js";

// Use the default Stripe test publishable key - replace with your own when ready for production
// This is a test key - safe to be in client-side code
const stripePromise = loadStripe('pk_test_51QyqmqPpAASNRvfwCEGudrz2PKWIZL2QFZomDQtGIRR4orWge75Sk7oCNLnUmmJJ86AJUAi6vgBmh6FEhDMRaiXH00L7cKRv7H')
  .then(stripe => {
    // Suppress common r.stripe.com beacon errors in console (safe to ignore)
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('r.stripe.com') || args[0]?.message?.includes?.('r.stripe.com')) {
        console.info('Stripe beacon blocked; checkout still works.');
        return;
      }
      originalError.apply(console, args);
    };
    return stripe;
  });

interface StripeWrapperProps {
  children: React.ReactNode;
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
    // Google Pay is initialized in the PaymentMethods component via the paymentRequest object
    // This is the correct approach as the payment_request property is not part of StripeElementsOptions
  };
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeWrapper;
