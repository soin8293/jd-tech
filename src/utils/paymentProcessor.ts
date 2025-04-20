
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

export const createCardPayment = async (stripe: any, elements: any) => {
  if (!stripe || !elements) {
    throw new Error("Stripe has not initialized yet");
  }
  
  const cardElement = elements.getElement(CardElement);
  
  if (!cardElement) {
    throw new Error("Card information is missing");
  }
  
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  });
  
  if (error) {
    throw new Error(error.message || "Your card was declined");
  }
  
  if (!paymentMethod || !paymentMethod.id) {
    throw new Error("Failed to process your card");
  }
  
  return paymentMethod.id;
};
