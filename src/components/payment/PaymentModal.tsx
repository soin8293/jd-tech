
import React, { useState, useEffect } from "react";
import { X, CreditCard, AlertTriangle, Check, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingDetails } from "@/types/hotel.types";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: BookingDetails | null;
  onPaymentComplete: () => void;
}

// Define this as a proper union type to fix the TypeScript errors
type PaymentStatus = 'idle' | 'loading' | 'processing' | 'error' | 'success';
type APIErrorType = 'payment_failed' | 'booking_failed' | 'network_error' | 'unknown';

interface APIError {
  type: APIErrorType;
  message: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingDetails,
  onPaymentComplete,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorDetails, setErrorDetails] = useState<APIError | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setErrorDetails(null);
      setClientSecret('');
      setTransactionId('');
    }
  }, [isOpen]);

  useEffect(() => {
    // Only fetch the payment intent when the modal is open and we have booking details
    if (isOpen && bookingDetails) {
      // Generate a unique transaction ID for this booking attempt
      const generatedTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setTransactionId(generatedTransactionId);
      
      setPaymentStatus('loading');
      
      // PLACEHOLDER API CALL to Firebase Cloud Function createPaymentIntent
      // REPLACE WITH REAL FIREBASE CLOUD FUNCTION URL when deployed
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: bookingDetails.totalPrice,
          currency: 'usd',
          booking_reference: `booking-${Date.now()}`,
          transaction_id: generatedTransactionId
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }
          return response.json();
        })
        .then(responseJson => {
          console.log('Simulated API call to Firebase Cloud Function createPaymentIntent successful');
          console.log('Response data:', responseJson);
          // Simulate setting client secret from Firebase function response
          setClientSecret('CLIENT_SECRET_FROM_FIREBASE_FUNCTION');
          setPaymentStatus('idle');
        })
        .catch(error => {
          console.error('Simulated API call to Firebase Cloud Function createPaymentIntent failed', error);
          setPaymentStatus('error');
          setErrorDetails({
            type: 'payment_failed',
            message: 'Failed to initialize payment. Please try again later.'
          });
        });
    }
  }, [isOpen, bookingDetails]);

  if (!bookingDetails) return null;

  const handleClose = () => {
    if (paymentStatus !== 'loading' && paymentStatus !== 'processing') {
      onClose();
      setPaymentStatus('idle');
      setErrorDetails(null);
    }
  };

  const handlePayWithCard = async () => {
    // This is where Stripe Elements integration will go
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      // PLACEHOLDER API CALL to Firebase Cloud Function processBooking
      // REPLACE WITH REAL FIREBASE CLOUD FUNCTION URL when deployed
      const processBookingData = {
        paymentMethodId: 'dummy_card_payment_id',
        bookingDetails: bookingDetails,
        paymentType: 'card',
        timestamp: new Date().toISOString(),
        transaction_id: transactionId
      };

      fetch('/api/process-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processBookingData),
      })
        .then(response => {
          if (!response.ok) {
            const status = response.status;
            // Handle different status codes differently
            if (status === 400) {
              throw new Error('Invalid booking data');
            } else if (status === 402) {
              throw new Error('Payment failed');
            } else if (status === 500) {
              throw new Error('Server error');
            }
            throw new Error('Booking processing failed');
          }
          return response.json();
        })
        .then(responseJson => {
          console.log('Simulated API call to Firebase Cloud Function processBooking successful');
          console.log('Response data:', responseJson);
          
          // For testing purposes - will be replaced with actual Stripe integration
          setPaymentStatus('success');
          setTimeout(() => {
            onPaymentComplete();
          }, 1500);
        })
        .catch(error => {
          console.error('Simulated API call to Firebase Cloud Function processBooking failed', error);
          setPaymentStatus('error');
          
          // Determine error type based on error message
          if (error.message.includes('Payment failed')) {
            setErrorDetails({
              type: 'payment_failed',
              message: 'Your payment could not be processed. Please try again or use a different payment method.'
            });
          } else if (error.message.includes('booking')) {
            setErrorDetails({
              type: 'booking_failed',
              message: 'Payment was successful, but booking could not be processed. Please contact support.'
            });
          } else {
            setErrorDetails({
              type: 'unknown',
              message: 'An unexpected error occurred. Please try again later.'
            });
          }
        });
    }, 2000);
  };

  const handleGooglePay = async () => {
    // This is where Google Pay integration will go
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      // PLACEHOLDER API CALL to Firebase Cloud Function processBooking
      // REPLACE WITH REAL FIREBASE CLOUD FUNCTION URL when deployed
      const processBookingData = {
        paymentMethodId: 'dummy_googlepay_payment_id',
        bookingDetails: bookingDetails,
        paymentType: 'google_pay',
        timestamp: new Date().toISOString(),
        transaction_id: transactionId
      };

      fetch('/api/process-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processBookingData),
      })
        .then(response => {
          if (!response.ok) {
            const status = response.status;
            // Handle different status codes differently
            if (status === 400) {
              throw new Error('Invalid booking data');
            } else if (status === 402) {
              throw new Error('Payment failed');
            } else if (status === 500) {
              throw new Error('Server error');
            }
            throw new Error('Booking processing failed');
          }
          return response.json();
        })
        .then(responseJson => {
          console.log('Simulated API call to Firebase Cloud Function processBooking successful');
          console.log('Response data:', responseJson);
          
          // For testing purposes - will be replaced with actual Google Pay integration
          setPaymentStatus('success');
          setTimeout(() => {
            onPaymentComplete();
          }, 1500);
        })
        .catch(error => {
          console.error('Simulated API call to Firebase Cloud Function processBooking failed', error);
          setPaymentStatus('error');
          
          // Determine error type based on error message
          if (error.message.includes('Payment failed')) {
            setErrorDetails({
              type: 'payment_failed',
              message: 'Your payment could not be processed. Please try again or use a different payment method.'
            });
          } else if (error.message.includes('booking')) {
            setErrorDetails({
              type: 'booking_failed',
              message: 'Payment was successful, but booking could not be processed. Please contact support.'
            });
          } else {
            setErrorDetails({
              type: 'unknown',
              message: 'An unexpected error occurred. Please try again later.'
            });
          }
        });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            Securely pay for your reservation using your preferred payment method.
          </DialogDescription>
        </DialogHeader>
        
        {/* Payment Status Messages */}
        {(paymentStatus === 'loading' || paymentStatus === 'processing') && (
          <div className="bg-secondary/50 p-4 rounded-md text-center my-4 flex flex-col items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">
              {paymentStatus === 'loading' ? 'Initializing payment...' : 'Processing your payment...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Please don't close this window.</p>
          </div>
        )}
        
        {paymentStatus === 'error' && (
          <div className="bg-destructive/10 p-4 rounded-md flex items-start gap-3 my-4">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {errorDetails?.type === 'payment_failed' ? 'Payment Failed' : 
                 errorDetails?.type === 'booking_failed' ? 'Booking Failed' : 'Error'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {errorDetails?.message || "There was an error processing your payment. Please try again."}
              </p>
            </div>
          </div>
        )}
        
        {paymentStatus === 'success' && (
          <div className="bg-green-50 p-4 rounded-md flex items-start gap-3 my-4">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-600">Payment Successful!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your booking has been confirmed. Booking reference: {transactionId}
              </p>
            </div>
          </div>
        )}
        
        {/* Booking Summary */}
        {paymentStatus !== 'loading' && paymentStatus !== 'processing' && paymentStatus !== 'success' && (
          <>
            <div className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">Booking Summary</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span>{format(bookingDetails.period.checkIn, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span>{format(bookingDetails.period.checkOut, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests:</span>
                    <span>{bookingDetails.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rooms:</span>
                    <span>{bookingDetails.rooms.length}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${bookingDetails.totalPrice}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div>
                <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
                
                {/* Google Pay Button */}
                <Button 
                  variant="outline" 
                  className="w-full h-12 mb-3 flex items-center justify-center"
                  onClick={handleGooglePay}
                  disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                >
                  <svg viewBox="0 0 41 17" className="h-6 w-auto">
                    <path d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.62-1.488-.62h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.665-1.559.996-2.583.996h-2.485v.001zM27.194 10.442c0 .392.166.718.499.98.332.26.722.391 1.168.391.633 0 1.196-.234 1.692-.701.497-.469.744-1.019.744-1.65-.469-.37-1.123-.555-1.962-.555-.61 0-1.12.148-1.528.442-.409.294-.613.657-.613 1.093m1.946-5.815c1.112 0 1.989.297 2.633.89.642.594.964 1.408.964 2.442v4.932h-1.439v-1.11h-.065c-.622.914-1.45 1.372-2.486 1.372-.882 0-1.621-.262-2.215-.784-.594-.523-.891-1.176-.891-1.96 0-.828.313-1.486.94-1.976s1.463-.735 2.51-.735c.892 0 1.629.163 2.206.49v-.344c0-.522-.207-.966-.621-1.33a2.132 2.132 0 0 0-1.455-.547c-.84 0-1.504.353-1.995 1.059l-1.324-.828c.73-1.045 1.81-1.568 3.238-1.568M40.993 4.889l-5.02 11.53H34.42l1.864-4.034-3.302-7.496h1.635l2.387 5.749h.032l2.322-5.75z" fill="#4285F4"></path>
                    <path d="M13.448 7.134c0-.473-.04-.93-.116-1.366H6.988v2.588h3.634a3.11 3.11 0 0 1-1.344 2.042v1.68h2.169c1.27-1.17 2.001-2.9 2.001-4.944" fill="#4285F4"></path>
                    <path d="M6.988 13.7c1.816 0 3.344-.595 4.459-1.621l-2.169-1.681c-.603.406-1.38.643-2.29.643-1.754 0-3.244-1.182-3.776-2.774H.978v1.731a6.728 6.728 0 0 0 6.01 3.703" fill="#34A853"></path>
                    <path d="M3.212 8.267a4.034 4.034 0 0 1 0-2.572V3.964H.978A6.678 6.678 0 0 0 .261 6.98c0 1.085.26 2.11.717 3.017l2.234-1.731z" fill="#FABB05"></path>
                    <path d="M6.988 2.921c.992 0 1.88.34 2.58 1.008v.001l1.92-1.918C10.324.928 8.804.262 6.989.262a6.728 6.728 0 0 0-6.01 3.702l2.234 1.731c.532-1.592 2.022-2.774 3.776-2.774" fill="#E94235"></path>
                  </svg>
                  <span className="ml-2">Pay with Google Pay</span>
                </Button>
                
                {/* Card Payment Button - Placeholder for Stripe Elements */}
                <Button 
                  variant="default" 
                  className="w-full h-12 mb-3"
                  onClick={handlePayWithCard}
                  disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with Card
                </Button>
                
                {/* This is where the Stripe Card Element will be rendered */}
                <div className="p-4 border border-border rounded-md mb-4 hidden">
                  <p className="text-center text-sm text-muted-foreground">
                    Card payment form will appear here when Stripe is integrated
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-4">
              <p>By proceeding with payment, you agree to our terms and conditions.</p>
              <p className="mt-1">Your payment information is secured with 256-bit encryption.</p>
              <p className="mt-1">Transaction ID: {transactionId || 'Not generated yet'}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
