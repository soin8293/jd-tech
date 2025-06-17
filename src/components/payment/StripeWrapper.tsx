
import React from "react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeElementsOptions } from "@stripe/stripe-js";

// Use environment variable for Stripe publishable key, with fallback to test key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QyqmqPpAASNRvfwCEGudrz2PKWIZL2QFZomDQtGIRR4orWge75Sk7oCNLnUmmJJ86AJUAi6vgBmh6FEhDMRaiXH00L7cKRv7H';

console.log("STRIPE_WRAPPER: Initializing Stripe with key:", STRIPE_PUBLISHABLE_KEY ? 'Key present' : 'No key found');

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  .then(stripe => {
    console.log("STRIPE_WRAPPER: Stripe loaded successfully:", !!stripe);
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
  })
  .catch(error => {
    console.error("STRIPE_WRAPPER: Failed to load Stripe:", error);
    return null;
  });

interface StripeWrapperProps {
  children: React.ReactNode;
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    loader: 'auto',
  };
  
  console.log("STRIPE_WRAPPER: Rendering Elements provider");
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeWrapper;
