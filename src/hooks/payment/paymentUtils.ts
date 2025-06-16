
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { APIError, PaymentResponse } from "@/components/payment/payment.types";

console.log("💳 PAYMENT_UTILS: ================ PAYMENT UTILS ULTRA DETAILED INITIALIZATION ================");
console.log("💳 PAYMENT_UTILS: Initialization timestamp:", new Date().toISOString());
console.log("💳 PAYMENT_UTILS: Module loading process ID:", Math.random().toString(36).substring(2, 15));
console.log("💳 PAYMENT_UTILS: JavaScript environment:", {
  nodeVersion: typeof process !== 'undefined' ? process.version : 'not node',
  browser: typeof window !== 'undefined' ? 'browser environment' : 'not browser',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'not available',
  currentURL: typeof window !== 'undefined' ? window.location.href : 'not available'
});

console.log("💳 PAYMENT_UTILS: Firebase functions object deep analysis:");
console.log("💳 PAYMENT_UTILS: Functions exists:", !!functions);
console.log("💳 PAYMENT_UTILS: Functions type:", typeof functions);
console.log("💳 PAYMENT_UTILS: Functions constructor:", functions?.constructor?.name);
console.log("💳 PAYMENT_UTILS: Functions prototype:", Object.getPrototypeOf(functions || {})?.constructor?.name);
console.log("💳 PAYMENT_UTILS: Functions keys:", Object.keys(functions || {}));
console.log("💳 PAYMENT_UTILS: Functions own properties:", Object.getOwnPropertyNames(functions || {}));
console.log("💳 PAYMENT_UTILS: Functions descriptors:", Object.getOwnPropertyDescriptors(functions || {}));

if (functions) {
  console.log("💳 PAYMENT_UTILS: Firebase functions detailed properties:", {
    region: functions.region,
    customDomain: functions.customDomain,
    app: {
      name: functions.app?.name,
      projectId: functions.app?.options?.projectId,
      authDomain: functions.app?.options?.authDomain,
      apiKey: functions.app?.options?.apiKey ? 'Present (masked)' : 'Missing',
      storageBucket: functions.app?.options?.storageBucket,
      messagingSenderId: functions.app?.options?.messagingSenderId,
      appId: functions.app?.options?.appId
    }
  });
} else {
  console.error("💳 PAYMENT_UTILS: ❌ CRITICAL: Firebase functions object is null/undefined!");
}

console.log("💳 PAYMENT_UTILS: Creating httpsCallable functions...");
console.log("💳 PAYMENT_UTILS: httpsCallable function analysis:", {
  exists: typeof httpsCallable === 'function',
  type: typeof httpsCallable,
  name: httpsCallable?.name,
  constructor: httpsCallable?.constructor?.name,
  length: httpsCallable?.length
});

console.log("💳 PAYMENT_UTILS: About to create createPaymentIntentFunction...");
export const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
console.log("💳 PAYMENT_UTILS: createPaymentIntentFunction created!");

console.log("💳 PAYMENT_UTILS: About to create processBookingFunction...");
export const processBookingFunction = httpsCallable(functions, 'processBooking');
console.log("💳 PAYMENT_UTILS: processBookingFunction created!");

console.log("💳 PAYMENT_UTILS: Function creation verification:", {
  createPaymentIntent: {
    exists: !!createPaymentIntentFunction,
    type: typeof createPaymentIntentFunction,
    name: createPaymentIntentFunction?.name || 'no name',
    constructor: createPaymentIntentFunction?.constructor?.name,
    toString: createPaymentIntentFunction?.toString?.()?.substring(0, 200) + '...',
    keys: Object.keys(createPaymentIntentFunction || {}),
    ownProperties: Object.getOwnPropertyNames(createPaymentIntentFunction || {})
  },
  processBooking: {
    exists: !!processBookingFunction,
    type: typeof processBookingFunction,
    name: processBookingFunction?.name || 'no name',
    constructor: processBookingFunction?.constructor?.name,
    toString: processBookingFunction?.toString?.()?.substring(0, 200) + '...',
    keys: Object.keys(processBookingFunction || {}),
    ownProperties: Object.getOwnPropertyNames(processBookingFunction || {})
  }
});

// Calculate expected function endpoint URLs
const projectId = functions?.app?.options?.projectId || 'UNKNOWN';
const region = functions?.region || 'us-central1';
console.log("💳 PAYMENT_UTILS: Expected Firebase function endpoint URLs:", {
  projectId,
  region,
  createPaymentIntentURL: `https://${region}-${projectId}.cloudfunctions.net/createPaymentIntent`,
  processBookingURL: `https://${region}-${projectId}.cloudfunctions.net/processBooking`,
  baseURL: `https://${region}-${projectId}.cloudfunctions.net/`
});

export const generateTransactionId = (): string => {
  console.log("💳 TRANSACTION_ID: ================ GENERATING TRANSACTION ID ================");
  const startTime = Date.now();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const transactionId = `txn_${timestamp}_${random}`;
  const endTime = Date.now();
  
  console.log("💳 TRANSACTION_ID: Generation details:", {
    timestamp,
    timestampDate: new Date(timestamp).toISOString(),
    random,
    randomLength: random.length,
    randomPattern: /^[a-z0-9]+$/.test(random),
    transactionId,
    transactionIdLength: transactionId.length,
    finalPattern: /^txn_\d+_[a-z0-9]+$/.test(transactionId),
    generationTimeMs: endTime - startTime,
    entropy: Math.log2(Math.pow(36, random.length)).toFixed(2) + ' bits'
  });
  
  console.log("💳 TRANSACTION_ID: Validation checks:", {
    startsWithTxn: transactionId.startsWith('txn_'),
    hasCorrectStructure: transactionId.split('_').length === 3,
    segments: transactionId.split('_'),
    timestampSegment: transactionId.split('_')[1],
    randomSegment: transactionId.split('_')[2],
    timestampIsNumber: !isNaN(Number(transactionId.split('_')[1])),
    randomIsAlphaNumeric: /^[a-z0-9]+$/.test(transactionId.split('_')[2])
  });
  
  return transactionId;
};

export const handlePaymentError = (error: any): APIError => {
  console.error("💳 PAYMENT ERROR: ================ ULTRA COMPREHENSIVE ERROR ANALYSIS ================");
  console.error("💳 PAYMENT ERROR: Error analysis timestamp:", new Date().toISOString());
  console.error("💳 PAYMENT ERROR: Error analysis process ID:", Math.random().toString(36).substring(2, 15));
  
  console.error("💳 PAYMENT ERROR: Runtime environment comprehensive analysis:", {
    timestamp: new Date().toISOString(),
    performance: {
      now: performance.now(),
      timeOrigin: performance.timeOrigin,
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      } : 'not available'
    },
    window: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      }
    },
    document: {
      readyState: document.readyState,
      visibilityState: document.visibilityState,
      title: document.title,
      URL: document.URL,
      domain: document.domain,
      referrer: document.referrer,
      cookie: document.cookie ? 'Present (masked)' : 'Empty'
    },
    navigator: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
        saveData: (navigator as any).connection.saveData,
        type: (navigator as any).connection.type
      } : 'not available'
    },
    location: {
      href: window.location.href,
      origin: window.location.origin,
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    }
  });
  
  console.error("💳 PAYMENT ERROR: Error object ultra-deep analysis:", {
    errorExists: !!error,
    errorType: typeof error,
    errorConstructor: error?.constructor?.name,
    errorPrototype: Object.getPrototypeOf(error || {})?.constructor?.name,
    errorString: String(error),
    errorToString: error?.toString?.(),
    errorValueOf: error?.valueOf?.(),
    errorInstanceChecks: {
      Error: error instanceof Error,
      Object: error instanceof Object,
      FirebaseError: error?.constructor?.name === 'FirebaseError',
      TypeError: error instanceof TypeError,
      ReferenceError: error instanceof ReferenceError,
      SyntaxError: error instanceof SyntaxError
    }
  });
  
  console.error("💳 PAYMENT ERROR: Error properties comprehensive analysis:", {
    name: {
      value: error?.name,
      type: typeof error?.name,
      length: error?.name?.length || 0
    },
    message: {
      value: error?.message,
      type: typeof error?.message,
      length: error?.message?.length || 0
    },
    code: {
      value: error?.code,
      type: typeof error?.code,
      length: error?.code?.length || 0
    },
    details: {
      value: error?.details,
      type: typeof error?.details,
      isObject: typeof error?.details === 'object',
      keys: error?.details ? Object.keys(error.details) : []
    },
    cause: {
      value: error?.cause,
      type: typeof error?.cause,
      hasCause: !!error?.cause
    },
    stack: {
      hasStack: !!error?.stack,
      type: typeof error?.stack,
      length: error?.stack?.length || 0,
      preview: error?.stack?.substring(0, 200) + '...'
    },
    customData: {
      hasCustomData: !!error?.customData,
      type: typeof error?.customData,
      keys: error?.customData ? Object.keys(error.customData) : []
    },
    serverResponse: {
      hasServerResponse: !!error?.serverResponse,
      type: typeof error?.serverResponse,
      keys: error?.serverResponse ? Object.keys(error.serverResponse) : []
    }
  });
  
  console.error("💳 PAYMENT ERROR: Error enumeration and serialization:");
  try {
    console.error("💳 PAYMENT ERROR: Object.keys():", Object.keys(error || {}));
  } catch (e) {
    console.error("💳 PAYMENT ERROR: Object.keys() failed:", e);
  }
  
  try {
    console.error("💳 PAYMENT ERROR: Object.getOwnPropertyNames():", Object.getOwnPropertyNames(error || {}));
  } catch (e) {
    console.error("💳 PAYMENT ERROR: Object.getOwnPropertyNames() failed:", e);
  }
  
  try {
    console.error("💳 PAYMENT ERROR: Object.getOwnPropertyDescriptors():", Object.getOwnPropertyDescriptors(error || {}));
  } catch (e) {
    console.error("💳 PAYMENT ERROR: Object.getOwnPropertyDescriptors() failed:", e);
  }
  
  try {
    console.error("💳 PAYMENT ERROR: JSON.stringify():", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  } catch (e) {
    console.error("💳 PAYMENT ERROR: JSON.stringify() failed:", e);
  }
  
  try {
    console.error("💳 PAYMENT ERROR: Full error object:", error);
  } catch (e) {
    console.error("💳 PAYMENT ERROR: Full error logging failed:", e);
  }
  
  // Firebase-specific error code ultra-detailed analysis
  if (error?.code) {
    console.error("💳 PAYMENT ERROR: 🔥 FIREBASE ERROR CODE ULTRA ANALYSIS 🔥");
    console.error("💳 PAYMENT ERROR: Code analysis:", {
      code: error.code,
      codeType: typeof error.code,
      codeLength: error.code?.length || 0,
      isString: typeof error.code === 'string',
      hasSlash: error.code?.includes?.('/'),
      segments: error.code?.split?.('/') || [],
      segmentCount: error.code?.split?.('/')?.length || 0,
      prefix: error.code?.split?.('/')[0],
      suffix: error.code?.split?.('/')[1]
    });
    
    switch (error.code) {
      case 'functions/internal':
        console.error("💳 PAYMENT ERROR: 🚨🚨🚨 FUNCTIONS/INTERNAL ERROR - MAXIMUM ALERT 🚨🚨🚨");
        console.error("💳 PAYMENT ERROR: This is the most critical Firebase Functions error!");
        console.error("💳 PAYMENT ERROR: Possible root causes (ordered by likelihood):");
        console.error("💳 PAYMENT ERROR:   🔥 1. Function crashed during execution with uncaught exception");
        console.error("💳 PAYMENT ERROR:   🔥 2. Function timeout exceeded (>60s for HTTP-triggered functions)");
        console.error("💳 PAYMENT ERROR:   🔥 3. Function ran out of memory (default: 256MB)");
        console.error("💳 PAYMENT ERROR:   🔥 4. Function not properly deployed or deployment incomplete");
        console.error("💳 PAYMENT ERROR:   🔥 5. Missing critical environment variables (STRIPE_SECRET_KEY)");
        console.error("💳 PAYMENT ERROR:   🔥 6. Firebase Admin SDK initialization failure");
        console.error("💳 PAYMENT ERROR:   🔥 7. External API failures (Stripe API down/invalid)");
        console.error("💳 PAYMENT ERROR:   🔥 8. Database connection issues (Firestore)");
        console.error("💳 PAYMENT ERROR:   🔥 9. Invalid request data structure causing parsing errors");
        console.error("💳 PAYMENT ERROR:   🔥 10. Node.js version compatibility issues");
        console.error("💳 PAYMENT ERROR: Immediate debugging steps:");
        console.error("💳 PAYMENT ERROR:   📋 1. Check Firebase Console > Functions > Logs");
        console.error("💳 PAYMENT ERROR:   📋 2. Verify function deployment status");
        console.error("💳 PAYMENT ERROR:   📋 3. Check environment variables in Firebase");
        console.error("💳 PAYMENT ERROR:   📋 4. Test function in Firebase Console");
        console.error("💳 PAYMENT ERROR:   📋 5. Check Stripe API status");
        break;
      case 'functions/not-found':
        console.error("💳 PAYMENT ERROR: 🚨 FUNCTIONS/NOT-FOUND ERROR 🚨");
        console.error("💳 PAYMENT ERROR: The 'createPaymentIntent' function doesn't exist or isn't deployed!");
        console.error("💳 PAYMENT ERROR: Debugging steps:");
        console.error("💳 PAYMENT ERROR:   📋 1. Check Firebase Console > Functions tab");
        console.error("💳 PAYMENT ERROR:   📋 2. Verify function is exported in functions/src/index.ts");
        console.error("💳 PAYMENT ERROR:   📋 3. Run 'firebase deploy --only functions'");
        console.error("💳 PAYMENT ERROR:   📋 4. Check function naming consistency");
        break;
      case 'functions/permission-denied':
        console.error("💳 PAYMENT ERROR: 🚨 FUNCTIONS/PERMISSION-DENIED ERROR 🚨");
        console.error("💳 PAYMENT ERROR: User doesn't have permission to call this function");
        console.error("💳 PAYMENT ERROR: Debugging steps:");
        console.error("💳 PAYMENT ERROR:   📋 1. Check if function requires authentication");
        console.error("💳 PAYMENT ERROR:   📋 2. Verify user is properly authenticated");
        console.error("💳 PAYMENT ERROR:   📋 3. Check function security rules");
        break;
      case 'functions/unauthenticated':
        console.error("💳 PAYMENT ERROR: 🚨 FUNCTIONS/UNAUTHENTICATED ERROR 🚨");
        console.error("💳 PAYMENT ERROR: User is not authenticated but function requires auth");
        console.error("💳 PAYMENT ERROR: Debugging steps:");
        console.error("💳 PAYMENT ERROR:   📋 1. Check user authentication status");
        console.error("💳 PAYMENT ERROR:   📋 2. Verify auth tokens are being sent");
        console.error("💳 PAYMENT ERROR:   📋 3. Check function auth requirements");
        break;
      case 'functions/resource-exhausted':
        console.error("💳 PAYMENT ERROR: 🚨 FUNCTIONS/RESOURCE-EXHAUSTED ERROR 🚨");
        console.error("💳 PAYMENT ERROR: Too many requests or quota exceeded");
        console.error("💳 PAYMENT ERROR: Debugging steps:");
        console.error("💳 PAYMENT ERROR:   📋 1. Check Firebase usage quotas");
        console.error("💳 PAYMENT ERROR:   📋 2. Implement rate limiting");
        console.error("💳 PAYMENT ERROR:   📋 3. Check for infinite loops");
        break;
      case 'functions/deadline-exceeded':
        console.error("💳 PAYMENT ERROR: 🚨 FUNCTIONS/DEADLINE-EXCEEDED ERROR 🚨");
        console.error("💳 PAYMENT ERROR: Function call timed out");
        console.error("💳 PAYMENT ERROR: Debugging steps:");
        console.error("💳 PAYMENT ERROR:   📋 1. Optimize function performance");
        console.error("💳 PAYMENT ERROR:   📋 2. Check external API response times");
        console.error("💳 PAYMENT ERROR:   📋 3. Increase function timeout if needed");
        break;
      default:
        console.error("💳 PAYMENT ERROR: 🚨 UNKNOWN FIREBASE ERROR CODE 🚨:", error.code);
        console.error("💳 PAYMENT ERROR: This is an unexpected error code!");
        console.error("💳 PAYMENT ERROR: Please check Firebase documentation for code:", error.code);
    }
  }
  
  // Network connectivity ultra-detailed analysis
  console.error("💳 PAYMENT ERROR: Network connectivity ultra-analysis:", {
    online: navigator.onLine,
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt,
      saveData: (navigator as any).connection.saveData,
      type: (navigator as any).connection.type || 'unknown'
    } : 'NetworkInformation API not available',
    performanceTiming: performance.timing ? {
      navigationStart: performance.timing.navigationStart,
      connectStart: performance.timing.connectStart,
      connectEnd: performance.timing.connectEnd,
      domainLookupStart: performance.timing.domainLookupStart,
      domainLookupEnd: performance.timing.domainLookupEnd,
      responseStart: performance.timing.responseStart,
      responseEnd: performance.timing.responseEnd,
      loadEventEnd: performance.timing.loadEventEnd
    } : 'PerformanceTiming API not available'
  });
  
  // Firebase project configuration ultra-detailed check
  console.error("💳 PAYMENT ERROR: Firebase configuration ultra-detailed analysis:", {
    functions: {
      exists: !!functions,
      type: typeof functions,
      constructor: functions?.constructor?.name
    },
    app: {
      exists: !!functions?.app,
      name: functions?.app?.name,
      automaticallyDataCollectionEnabled: functions?.app?.automaticallyDataCollectionEnabled
    },
    options: functions?.app?.options ? {
      projectId: functions.app.options.projectId || 'MISSING',
      authDomain: functions.app.options.authDomain || 'MISSING',
      apiKey: functions.app.options.apiKey ? 'Present (masked)' : 'MISSING',
      storageBucket: functions.app.options.storageBucket || 'MISSING',
      messagingSenderId: functions.app.options.messagingSenderId || 'MISSING',
      appId: functions.app.options.appId || 'MISSING',
      measurementId: functions.app.options.measurementId || 'MISSING'
    } : 'Options not available',
    region: functions?.region || 'MISSING',
    customDomain: functions?.customDomain || 'None'
  });
  
  // Check for deployment-related issues
  const isDeploymentIssue = error?.code === 'functions/internal' || 
                           error?.code === 'functions/not-found' ||
                           error?.message?.toLowerCase()?.includes?.('internal');
  
  if (isDeploymentIssue) {
    console.error("💳 PAYMENT ERROR: 🔥🔥🔥 DEPLOYMENT ISSUE HIGHLY SUSPECTED! 🔥🔥🔥");
    console.error("💳 PAYMENT ERROR: Priority action plan:");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 1. Check Firebase Functions deployment status in Console");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 2. Verify function exists and is properly exported");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 3. Check function logs for runtime errors");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 4. Ensure all dependencies are correctly installed");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 5. Verify environment variables (especially STRIPE_SECRET_KEY)");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 6. Test function manually in Firebase Console");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 7. Check Stripe configuration and API status");
    console.error("💳 PAYMENT ERROR:   🚨 URGENT 8. Verify Firebase project billing is active");
  }
  
  // Authentication debugging (safer access)
  console.error("💳 PAYMENT ERROR: Authentication ultra-debugging:", {
    localStorage: {
      hasFirebaseAuth: !!localStorage.getItem('firebase:authUser:AIzaSyBEOMvNQtNC4GCoffyr0LR_v1b78093HAM:[DEFAULT]'),
      firebaseKeys: Object.keys(localStorage).filter(key => key.includes('firebase')),
      totalLocalStorageKeys: Object.keys(localStorage).length,
      localStorageSize: JSON.stringify(localStorage).length + ' characters'
    },
    sessionStorage: {
      hasFirebaseSession: Object.keys(sessionStorage).some(key => key.includes('firebase')),
      firebaseKeys: Object.keys(sessionStorage).filter(key => key.includes('firebase')),
      totalSessionStorageKeys: Object.keys(sessionStorage).length
    }
  });
  
  // Create processed API error
  const apiError: APIError = {
    type: error?.details?.type || error?.code || 'unknown_error',
    message: error?.message || "Failed to process payment - unknown error occurred"
  };
  
  console.error("💳 PAYMENT ERROR: Final processed API error for UI:", {
    apiError,
    originalErrorPreserved: !!error,
    processingTimestamp: new Date().toISOString()
  });
  
  // Show user-friendly toast
  toast({
    title: "Payment Error",
    description: error?.message || "There was a problem with your payment. Please try again.",
    variant: "destructive",
  });
  
  console.error("💳 PAYMENT ERROR: ================ ERROR ANALYSIS COMPLETED ================");
  
  return apiError;
};

export const saveBookingToLocalStorage = (bookingId: string, bookingToken: string | undefined): void => {
  console.log("💾 STORAGE: ================ SAVING BOOKING TO LOCAL STORAGE ================");
  console.log("💾 STORAGE: Save timestamp:", new Date().toISOString());
  console.log("💾 STORAGE: Booking details:", {
    bookingId,
    bookingIdType: typeof bookingId,
    bookingIdLength: bookingId?.length || 0,
    hasBookingToken: !!bookingToken,
    bookingTokenType: typeof bookingToken,
    bookingTokenLength: bookingToken?.length || 0
  });
  
  console.log("💾 STORAGE: Local storage before save:", {
    totalKeys: Object.keys(localStorage).length,
    totalSize: JSON.stringify(localStorage).length + ' characters',
    hasExistingBookingId: !!localStorage.getItem('lastBookingId'),
    hasExistingToken: !!localStorage.getItem('lastBookingToken'),
    existingBookingId: localStorage.getItem('lastBookingId'),
    existingToken: localStorage.getItem('lastBookingToken') ? 'Present (masked)' : 'None'
  });
  
  if (bookingId) {
    try {
      localStorage.setItem('lastBookingId', bookingId);
      console.log("💾 STORAGE: ✅ Booking ID saved successfully");
      
      if (bookingToken) {
        localStorage.setItem('lastBookingToken', bookingToken);
        console.log("💾 STORAGE: ✅ Booking token saved successfully");
      } else {
        console.log("💾 STORAGE: ⚠️ No booking token provided, skipping token save");
      }
    } catch (error) {
      console.error("💾 STORAGE: ❌ Error saving to localStorage:", error);
    }
  } else {
    console.error("💾 STORAGE: ❌ No booking ID provided, cannot save");
  }
  
  console.log("💾 STORAGE: Local storage after save:", {
    totalKeys: Object.keys(localStorage).length,
    totalSize: JSON.stringify(localStorage).length + ' characters',
    savedBookingId: localStorage.getItem('lastBookingId'),
    savedTokenExists: !!localStorage.getItem('lastBookingToken')
  });
  
  console.log("💾 STORAGE: ================ BOOKING SAVE COMPLETED ================");
};
