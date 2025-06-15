
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { APIError, PaymentResponse } from "@/components/payment/payment.types";

export const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
export const processBookingFunction = httpsCallable(functions, 'processBooking');

export const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const transactionId = `txn_${timestamp}_${random}`;
  
  console.log("💳 TRANSACTION_ID: Generated new transaction ID:", {
    transactionId,
    timestamp,
    random,
    length: transactionId.length,
    pattern: /^txn_\d+_[a-z0-9]+$/.test(transactionId)
  });
  
  return transactionId;
};

export const handlePaymentError = (error: any): APIError => {
  console.error("💳 PAYMENT ERROR: ============= ULTRA DETAILED ERROR ANALYSIS =============");
  console.error("💳 PAYMENT ERROR: Error analysis timestamp:", new Date().toISOString());
  console.error("💳 PAYMENT ERROR: Runtime environment:", {
    userAgent: navigator.userAgent,
    url: window.location.href,
    origin: window.location.origin,
    protocol: window.location.protocol,
    host: window.location.host,
    referrer: document.referrer,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    language: navigator.language,
    platform: navigator.platform
  });
  
  console.error("💳 PAYMENT ERROR: Error object deep analysis:", {
    errorExists: !!error,
    errorType: typeof error,
    errorConstructor: error?.constructor?.name,
    errorPrototype: Object.getPrototypeOf(error)?.constructor?.name,
    errorInstanceOf: {
      Error: error instanceof Error,
      Object: error instanceof Object,
      FirebaseError: error?.constructor?.name === 'FirebaseError'
    }
  });
  
  console.error("💳 PAYMENT ERROR: Error properties:", {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    details: error?.details,
    cause: error?.cause,
    stack: error?.stack,
    customData: error?.customData,
    serverResponse: error?.serverResponse
  });
  
  console.error("💳 PAYMENT ERROR: Error property types:", {
    nameType: typeof error?.name,
    messageType: typeof error?.message,
    codeType: typeof error?.code,
    detailsType: typeof error?.details,
    causeType: typeof error?.cause,
    stackType: typeof error?.stack
  });
  
  console.error("💳 PAYMENT ERROR: Full error object:", error);
  console.error("💳 PAYMENT ERROR: Error JSON serialization:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  console.error("💳 PAYMENT ERROR: Error string conversion:", String(error));
  console.error("💳 PAYMENT ERROR: Error toString():", error?.toString?.());
  console.error("💳 PAYMENT ERROR: Error valueOf():", error?.valueOf?.());
  
  // Deep Firebase-specific error analysis
  if (error?.code) {
    console.error("💳 PAYMENT ERROR: Firebase error code analysis:", {
      code: error.code,
      codeType: typeof error.code,
      isString: typeof error.code === 'string',
      codeLength: error.code?.length,
      hasSlash: error.code?.includes?.('/'),
      segments: error.code?.split?.('/')
    });
    
    switch (error.code) {
      case 'functions/internal':
        console.error("💳 PAYMENT ERROR: FIREBASE FUNCTIONS INTERNAL ERROR DETECTED!");
        console.error("💳 PAYMENT ERROR: Possible causes:");
        console.error("💳 PAYMENT ERROR:   ❌ Function crashed during execution");
        console.error("💳 PAYMENT ERROR:   ❌ Function timeout (>60s for HTTP calls)");
        console.error("💳 PAYMENT ERROR:   ❌ Uncaught exception in function code");
        console.error("💳 PAYMENT ERROR:   ❌ Memory limit exceeded");
        console.error("💳 PAYMENT ERROR:   ❌ Function not properly deployed");
        console.error("💳 PAYMENT ERROR:   ❌ Missing environment variables");
        console.error("💳 PAYMENT ERROR:   ❌ Invalid request data structure");
        console.error("💳 PAYMENT ERROR:   ❌ Database connection issues");
        console.error("💳 PAYMENT ERROR:   ❌ External API failures (Stripe, etc.)");
        break;
      case 'functions/not-found':
        console.error("💳 PAYMENT ERROR: FUNCTION NOT FOUND!");
        console.error("💳 PAYMENT ERROR: The 'createPaymentIntent' function doesn't exist or isn't deployed");
        break;
      case 'functions/permission-denied':
        console.error("💳 PAYMENT ERROR: PERMISSION DENIED!");
        console.error("💳 PAYMENT ERROR: User doesn't have permission to call this function");
        break;
      case 'functions/unauthenticated':
        console.error("💳 PAYMENT ERROR: UNAUTHENTICATED!");
        console.error("💳 PAYMENT ERROR: User is not authenticated");
        break;
      case 'functions/resource-exhausted':
        console.error("💳 PAYMENT ERROR: RESOURCE EXHAUSTED!");
        console.error("💳 PAYMENT ERROR: Too many requests or quota exceeded");
        break;
      case 'functions/deadline-exceeded':
        console.error("💳 PAYMENT ERROR: DEADLINE EXCEEDED!");
        console.error("💳 PAYMENT ERROR: Function call timed out");
        break;
      default:
        console.error("💳 PAYMENT ERROR: UNKNOWN FIREBASE ERROR CODE:", error.code);
    }
  }
  
  // Check network connectivity
  console.error("💳 PAYMENT ERROR: Network analysis:", {
    online: navigator.onLine,
    connection: (navigator as any).connection?.effectiveType,
    downlink: (navigator as any).connection?.downlink,
    rtt: (navigator as any).connection?.rtt,
    saveData: (navigator as any).connection?.saveData
  });
  
  // Firebase project configuration check
  console.error("💳 PAYMENT ERROR: Firebase configuration:", {
    projectId: functions.app.options.projectId,
    authDomain: functions.app.options.authDomain,
    apiKey: functions.app.options.apiKey ? "Present" : "Missing",
    functionsRegion: functions._region,
    functionsEmulator: functions._url,
    appName: functions.app.name
  });
  
  // Check if this might be a deployment issue
  const isDeploymentIssue = error?.code === 'functions/internal' || 
                           error?.code === 'functions/not-found' ||
                           error?.message?.includes?.('internal');
  
  if (isDeploymentIssue) {
    console.error("💳 PAYMENT ERROR: DEPLOYMENT ISSUE SUSPECTED!");
    console.error("💳 PAYMENT ERROR: Recommended actions:");
    console.error("💳 PAYMENT ERROR:   1. Check Firebase Functions deployment status");
    console.error("💳 PAYMENT ERROR:   2. Verify function exists in Firebase Console");
    console.error("💳 PAYMENT ERROR:   3. Check function logs for runtime errors");
    console.error("💳 PAYMENT ERROR:   4. Ensure all dependencies are installed");
    console.error("💳 PAYMENT ERROR:   5. Verify environment variables are set");
    console.error("💳 PAYMENT ERROR:   6. Check Stripe configuration");
  }
  
  const apiError: APIError = {
    type: error.details?.type || error.code || 'unknown',
    message: error.message || "Failed to process payment"
  };
  
  console.error("💳 PAYMENT ERROR: Processed API error:", apiError);
  console.error("💳 PAYMENT ERROR: ============= END ULTRA DETAILED ERROR ANALYSIS =============");
  
  toast({
    title: "Payment Error",
    description: error.message || "There was a problem with your payment",
    variant: "destructive",
  });
  
  return apiError;
};

export const saveBookingToLocalStorage = (bookingId: string, bookingToken: string | undefined): void => {
  console.log("💾 STORAGE: Saving booking to localStorage", { bookingId, hasToken: !!bookingToken });
  if (bookingId) {
    localStorage.setItem('lastBookingId', bookingId);
    if (bookingToken) {
      localStorage.setItem('lastBookingToken', bookingToken);
    }
  }
};
