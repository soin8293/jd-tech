
import { useState, useEffect } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { PaymentResponse } from "@/components/payment/payment.types";
import { toast } from "@/hooks/use-toast";
import { createPaymentIntentFunction, generateTransactionId, handlePaymentError } from "./paymentUtils";

interface FirebaseFunctionResult {
  data: PaymentResponse;
}

export const usePaymentIntent = (isOpen: boolean, bookingDetails: BookingDetails | null) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (isOpen && bookingDetails) {
      console.log("🚀 PAYMENT_INTENT: ================ ULTRA DETAILED PAYMENT INTENT CREATION START ================");
      console.log("🚀 PAYMENT_INTENT: Hook useEffect triggered at:", new Date().toISOString());
      console.log("🚀 PAYMENT_INTENT: Process ID:", Math.random().toString(36).substring(2, 15));
      console.log("🚀 PAYMENT_INTENT: Modal state - isOpen:", isOpen);
      console.log("🚀 PAYMENT_INTENT: Browser environment:", {
        userAgent: navigator.userAgent,
        currentURL: window.location.href,
        origin: window.location.origin,
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        referrer: document.referrer,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory || 'unknown',
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
          saveData: (navigator as any).connection.saveData
        } : 'unknown'
      });
      
      console.log("🚀 PAYMENT_INTENT: React state before processing:", {
        clientSecret: clientSecret || 'empty',
        paymentIntentId: paymentIntentId || 'empty',
        transactionId: transactionId || 'empty',
        calculatedAmount,
        isLoading,
        hasError: !!error,
        errorMessage: error?.message || 'none'
      });
      
      console.log("🚀 PAYMENT_INTENT: BookingDetails COMPLETE ANALYSIS:");
      console.log("🚀 PAYMENT_INTENT: BookingDetails exists:", !!bookingDetails);
      console.log("🚀 PAYMENT_INTENT: BookingDetails type:", typeof bookingDetails);
      console.log("🚀 PAYMENT_INTENT: BookingDetails constructor:", bookingDetails?.constructor?.name);
      console.log("🚀 PAYMENT_INTENT: BookingDetails keys:", Object.keys(bookingDetails || {}));
      console.log("🚀 PAYMENT_INTENT: BookingDetails full object:", JSON.stringify(bookingDetails, null, 2));
      
      if (bookingDetails) {
        console.log("🚀 PAYMENT_INTENT: Period analysis:", {
          hasPeriod: !!bookingDetails.period,
          periodType: typeof bookingDetails.period,
          periodKeys: Object.keys(bookingDetails.period || {}),
          checkIn: {
            exists: !!bookingDetails.period?.checkIn,
            type: typeof bookingDetails.period?.checkIn,
            value: bookingDetails.period?.checkIn,
            isDate: bookingDetails.period?.checkIn instanceof Date,
            isValid: bookingDetails.period?.checkIn instanceof Date && !isNaN(bookingDetails.period.checkIn.getTime()),
            toISOString: bookingDetails.period?.checkIn instanceof Date ? bookingDetails.period.checkIn.toISOString() : 'not a date',
            toString: bookingDetails.period?.checkIn?.toString?.() || 'no toString method'
          },
          checkOut: {
            exists: !!bookingDetails.period?.checkOut,
            type: typeof bookingDetails.period?.checkOut,
            value: bookingDetails.period?.checkOut,
            isDate: bookingDetails.period?.checkOut instanceof Date,
            isValid: bookingDetails.period?.checkOut instanceof Date && !isNaN(bookingDetails.period.checkOut.getTime()),
            toISOString: bookingDetails.period?.checkOut instanceof Date ? bookingDetails.period.checkOut.toISOString() : 'not a date',
            toString: bookingDetails.period?.checkOut?.toString?.() || 'no toString method'
          }
        });
        
        console.log("🚀 PAYMENT_INTENT: Rooms analysis:", {
          hasRooms: !!bookingDetails.rooms,
          roomsType: typeof bookingDetails.rooms,
          roomsIsArray: Array.isArray(bookingDetails.rooms),
          roomsLength: bookingDetails.rooms?.length || 0,
          roomsDetailed: bookingDetails.rooms?.map((room, index) => ({
            index,
            id: room.id,
            name: room.name,
            price: room.price,
            priceType: typeof room.price,
            capacity: room.capacity,
            hasImages: !!room.images?.length,
            imageCount: room.images?.length || 0,
            allKeys: Object.keys(room)
          })) || []
        });
        
        console.log("🚀 PAYMENT_INTENT: Other booking details:", {
          guests: {
            value: bookingDetails.guests,
            type: typeof bookingDetails.guests,
            isNumber: typeof bookingDetails.guests === 'number',
            isPositive: bookingDetails.guests > 0
          },
          totalPrice: {
            value: bookingDetails.totalPrice,
            type: typeof bookingDetails.totalPrice,
            isNumber: typeof bookingDetails.totalPrice === 'number',
            isPositive: bookingDetails.totalPrice > 0
          }
        });
      }
      
      console.log("🚀 PAYMENT_INTENT: Setting loading state and clearing previous data...");
      setIsLoading(true);
      setError(null);
      setClientSecret('');
      setPaymentIntentId('');
      setCalculatedAmount(null);
      
      const generatedTransactionId = generateTransactionId();
      console.log("🚀 PAYMENT_INTENT: Transaction ID generation:", {
        generated: generatedTransactionId,
        length: generatedTransactionId.length,
        pattern: /^txn_\d+_[a-z0-9]+$/.test(generatedTransactionId),
        timestamp: Date.now(),
        randomPart: generatedTransactionId.split('_')[2]
      });
      setTransactionId(generatedTransactionId);
      
      // Validate dates before sending
      const checkInDate = bookingDetails.period.checkIn;
      const checkOutDate = bookingDetails.period.checkOut;
      console.log("🚀 PAYMENT_INTENT: Date validation comprehensive check:", {
        checkIn: {
          raw: checkInDate,
          type: typeof checkInDate,
          constructor: checkInDate?.constructor?.name,
          isDate: checkInDate instanceof Date,
          isValidDate: checkInDate instanceof Date && !isNaN(checkInDate.getTime()),
          toISOString: checkInDate instanceof Date ? checkInDate.toISOString() : 'conversion failed',
          getTime: checkInDate instanceof Date ? checkInDate.getTime() : 'not a date',
          year: checkInDate instanceof Date ? checkInDate.getFullYear() : 'not a date',
          month: checkInDate instanceof Date ? checkInDate.getMonth() + 1 : 'not a date',
          day: checkInDate instanceof Date ? checkInDate.getDate() : 'not a date'
        },
        checkOut: {
          raw: checkOutDate,
          type: typeof checkOutDate,
          constructor: checkOutDate?.constructor?.name,
          isDate: checkOutDate instanceof Date,
          isValidDate: checkOutDate instanceof Date && !isNaN(checkOutDate.getTime()),
          toISOString: checkOutDate instanceof Date ? checkOutDate.toISOString() : 'conversion failed',
          getTime: checkOutDate instanceof Date ? checkOutDate.getTime() : 'not a date',
          year: checkOutDate instanceof Date ? checkOutDate.getFullYear() : 'not a date',
          month: checkOutDate instanceof Date ? checkOutDate.getMonth() + 1 : 'not a date',
          day: checkOutDate instanceof Date ? checkOutDate.getDate() : 'not a date'
        },
        dateDifference: checkInDate instanceof Date && checkOutDate instanceof Date ? 
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24) : 'cannot calculate'
      });
      
      const paymentData = {
        rooms: bookingDetails.rooms,
        period: {
          checkIn: checkInDate instanceof Date ? checkInDate.toISOString() : checkInDate,
          checkOut: checkOutDate instanceof Date ? checkOutDate.toISOString() : checkOutDate
        },
        guests: bookingDetails.guests,
        transaction_id: generatedTransactionId,
        currency: 'usd'
      };
      
      console.log("🚀 PAYMENT_INTENT: Payment data prepared for Firebase function:");
      console.log("🚀 PAYMENT_INTENT: Payment data structure:", {
        hasRooms: !!paymentData.rooms,
        roomsCount: paymentData.rooms?.length,
        hasPeriod: !!paymentData.period,
        hasCheckIn: !!paymentData.period?.checkIn,
        hasCheckOut: !!paymentData.period?.checkOut,
        hasGuests: !!paymentData.guests,
        hasTransactionId: !!paymentData.transaction_id,
        hasCurrency: !!paymentData.currency
      });
      console.log("🚀 PAYMENT_INTENT: Payment data JSON:", JSON.stringify(paymentData, null, 2));
      console.log("🚀 PAYMENT_INTENT: Payment data size (bytes):", JSON.stringify(paymentData).length);
      
      console.log("🚀 PAYMENT_INTENT: Firebase function reference analysis:");
      console.log("🚀 PAYMENT_INTENT: Function exists:", typeof createPaymentIntentFunction === 'function');
      console.log("🚀 PAYMENT_INTENT: Function name:", createPaymentIntentFunction?.name);
      console.log("🚀 PAYMENT_INTENT: Function toString preview:", createPaymentIntentFunction?.toString?.()?.substring(0, 200) + '...');
      console.log("🚀 PAYMENT_INTENT: Function prototype:", Object.getPrototypeOf(createPaymentIntentFunction)?.constructor?.name);
      console.log("🚀 PAYMENT_INTENT: Function constructor:", createPaymentIntentFunction?.constructor?.name);
      
      console.log("🚀 PAYMENT_INTENT: About to call createPaymentIntent Firebase function...");
      console.log("🚀 PAYMENT_INTENT: Call initiation timestamp:", new Date().toISOString());
      console.log("🚀 PAYMENT_INTENT: Call stack trace:", new Error('Call stack trace').stack);
      
      // Enhanced timeout and monitoring
      const timeoutDuration = 45000; // 45 seconds
      console.log("🚀 PAYMENT_INTENT: Setting up timeout wrapper with duration:", timeoutDuration + 'ms');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error("❌ PAYMENT_INTENT: TIMEOUT! Function call exceeded", timeoutDuration + 'ms');
          reject(new Error(`Function call timeout after ${timeoutDuration / 1000} seconds`));
        }, timeoutDuration);
      });
      
      console.log("🚀 PAYMENT_INTENT: Creating function call promise...");
      const functionCallPromise = createPaymentIntentFunction(paymentData);
      
      console.log("🚀 PAYMENT_INTENT: Function call promise created:", {
        promiseType: typeof functionCallPromise,
        promiseConstructor: functionCallPromise?.constructor?.name,
        promisePrototype: Object.getPrototypeOf(functionCallPromise)?.constructor?.name,
        hasThenth: typeof functionCallPromise?.then === 'function',
        hasCatch: typeof functionCallPromise?.catch === 'function',
        hasFinally: typeof functionCallPromise?.finally === 'function'
      });
      
      console.log("🚀 PAYMENT_INTENT: Starting Promise.race between function call and timeout...");
      const raceStartTime = Date.now();
      
      Promise.race([functionCallPromise, timeoutPromise])
        .then((result: unknown) => {
          const raceEndTime = Date.now();
          const callDuration = raceEndTime - raceStartTime;
          
          console.log("✅ PAYMENT_INTENT: ================ FUNCTION CALL SUCCESSFUL ================");
          console.log("✅ PAYMENT_INTENT: Success timestamp:", new Date().toISOString());
          console.log("✅ PAYMENT_INTENT: Call duration:", callDuration + 'ms');
          console.log("✅ PAYMENT_INTENT: Performance metrics:", {
            callDurationMs: callDuration,
            callDurationSeconds: (callDuration / 1000).toFixed(2),
            withinTimeout: callDuration < timeoutDuration,
            memoryUsage: (performance as any).memory ? {
              used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
              total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + 'MB',
              limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
            } : 'not available'
          });
          
          console.log("✅ PAYMENT_INTENT: Raw result deep analysis:");
          console.log("✅ PAYMENT_INTENT: Result type:", typeof result);
          console.log("✅ PAYMENT_INTENT: Result constructor:", (result as any)?.constructor?.name);
          console.log("✅ PAYMENT_INTENT: Result prototype:", Object.getPrototypeOf(result || {})?.constructor?.name);
          console.log("✅ PAYMENT_INTENT: Result keys:", Object.keys(result || {}));
          console.log("✅ PAYMENT_INTENT: Result enumerable properties:", Object.getOwnPropertyNames(result || {}));
          console.log("✅ PAYMENT_INTENT: Result descriptors:", Object.getOwnPropertyDescriptors(result || {}));
          console.log("✅ PAYMENT_INTENT: Result JSON serialization:", JSON.stringify(result, null, 2));
          
          const typedResult = result as FirebaseFunctionResult;
          console.log("✅ PAYMENT_INTENT: Typed result analysis:");
          console.log("✅ PAYMENT_INTENT: Has data property:", 'data' in (typedResult || {}));
          console.log("✅ PAYMENT_INTENT: Data type:", typeof typedResult?.data);
          console.log("✅ PAYMENT_INTENT: Data constructor:", typedResult?.data?.constructor?.name);
          console.log("✅ PAYMENT_INTENT: Data keys:", Object.keys(typedResult?.data || {}));
          console.log("✅ PAYMENT_INTENT: Data JSON:", JSON.stringify(typedResult?.data, null, 2));
          
          const responseData = typedResult.data as PaymentResponse;
          console.log("✅ PAYMENT_INTENT: Response data analysis:");
          console.log("✅ PAYMENT_INTENT: Response data exists:", !!responseData);
          console.log("✅ PAYMENT_INTENT: Response data type:", typeof responseData);
          console.log("✅ PAYMENT_INTENT: Response data keys:", Object.keys(responseData || {}));
          console.log("✅ PAYMENT_INTENT: Response data JSON:", JSON.stringify(responseData, null, 2));
          
          if (responseData?.clientSecret) {
            console.log("✅ PAYMENT_INTENT: Client secret comprehensive analysis:", {
              exists: !!responseData.clientSecret,
              type: typeof responseData.clientSecret,
              length: responseData.clientSecret.length,
              startsWithPi: responseData.clientSecret.startsWith('pi_'),
              endsWithSecret: responseData.clientSecret.includes('_secret_'),
              pattern: /^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/.test(responseData.clientSecret),
              segments: responseData.clientSecret.split('_'),
              segmentCount: responseData.clientSecret.split('_').length,
              firstSegment: responseData.clientSecret.split('_')[0],
              lastSegment: responseData.clientSecret.split('_').slice(-1)[0],
              preview: responseData.clientSecret.substring(0, 20) + '...' + responseData.clientSecret.substring(responseData.clientSecret.length - 10)
            });
            
            console.log("✅ PAYMENT_INTENT: Payment intent ID analysis:", {
              exists: !!responseData.paymentIntentId,
              type: typeof responseData.paymentIntentId,
              length: responseData.paymentIntentId?.length || 0,
              startsWithPi: responseData.paymentIntentId?.startsWith('pi_'),
              preview: responseData.paymentIntentId?.substring(0, 20) + '...'
            });
            
            console.log("✅ PAYMENT_INTENT: Calculated amount analysis:", {
              exists: !!responseData.calculatedAmount,
              type: typeof responseData.calculatedAmount,
              value: responseData.calculatedAmount,
              isNumber: typeof responseData.calculatedAmount === 'number',
              isPositive: responseData.calculatedAmount > 0,
              clientAmount: bookingDetails.totalPrice,
              difference: responseData.calculatedAmount ? Math.abs(responseData.calculatedAmount - bookingDetails.totalPrice) : 'no server amount',
              percentageDiff: responseData.calculatedAmount ? 
                ((Math.abs(responseData.calculatedAmount - bookingDetails.totalPrice) / bookingDetails.totalPrice) * 100).toFixed(2) + '%' : 'no server amount'
            });
            
            console.log("✅ PAYMENT_INTENT: Setting React state with successful response...");
            setClientSecret(responseData.clientSecret);
            setPaymentIntentId(responseData.paymentIntentId || '');
            
            if (responseData.calculatedAmount) {
              setCalculatedAmount(responseData.calculatedAmount);
            }
            
            setIsLoading(false);
            setError(null);
            
            console.log("✅ PAYMENT_INTENT: React state updated successfully:");
            console.log("✅ PAYMENT_INTENT: Final state preview:", {
              hasClientSecret: !!responseData.clientSecret,
              hasPaymentIntentId: !!responseData.paymentIntentId,
              hasCalculatedAmount: !!responseData.calculatedAmount,
              isLoading: false,
              hasError: false
            });
            console.log("✅ PAYMENT_INTENT: ================ PAYMENT INTENT SETUP COMPLETED SUCCESSFULLY ================");
          } else {
            console.error("❌ PAYMENT_INTENT: CRITICAL ERROR - No client secret in response!");
            console.error("❌ PAYMENT_INTENT: Response structure detailed analysis:", {
              hasTypedResult: !!typedResult,
              hasData: !!typedResult?.data,
              dataKeys: Object.keys(typedResult?.data || {}),
              clientSecretValue: responseData?.clientSecret,
              clientSecretType: typeof responseData?.clientSecret,
              clientSecretLength: responseData?.clientSecret?.length || 0,
              allResponseProperties: Object.getOwnPropertyNames(responseData || {}),
              responseStringified: JSON.stringify(responseData, null, 2)
            });
            throw new Error("Invalid response received from createPaymentIntent - no client secret found");
          }
        })
        .catch((error: any) => {
          const raceEndTime = Date.now();
          const callDuration = raceEndTime - raceStartTime;
          
          console.error("❌ PAYMENT_INTENT: ================ FUNCTION CALL FAILED ================");
          console.error("❌ PAYMENT_INTENT: Error timestamp:", new Date().toISOString());
          console.error("❌ PAYMENT_INTENT: Call duration before error:", callDuration + 'ms');
          console.error("❌ PAYMENT_INTENT: Error occurred during createPaymentIntent call");
          
          console.error("❌ PAYMENT_INTENT: Error comprehensive analysis:", {
            errorExists: !!error,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            errorPrototype: Object.getPrototypeOf(error || {})?.constructor?.name,
            errorName: error?.name,
            errorMessage: error?.message,
            errorCode: error?.code,
            errorDetails: error?.details,
            errorCause: error?.cause,
            errorStack: error?.stack,
            hasCustomData: !!error?.customData,
            customData: error?.customData,
            errorKeys: Object.keys(error || {}),
            errorOwnProperties: Object.getOwnPropertyNames(error || {}),
            errorDescriptors: Object.getOwnPropertyDescriptors(error || {})
          });
          
          console.error("❌ PAYMENT_INTENT: Error serialization attempts:");
          console.error("❌ PAYMENT_INTENT: Error as string:", String(error));
          console.error("❌ PAYMENT_INTENT: Error toString():", error?.toString?.());
          console.error("❌ PAYMENT_INTENT: Error valueOf():", error?.valueOf?.());
          console.error("❌ PAYMENT_INTENT: Error JSON attempt:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
          
          // Check for specific error types
          if (error?.message?.includes?.('timeout')) {
            console.error("❌ PAYMENT_INTENT: 🔥 TIMEOUT ERROR DETECTED 🔥");
            console.error("❌ PAYMENT_INTENT: Function took longer than", timeoutDuration + 'ms', "to respond");
            console.error("❌ PAYMENT_INTENT: This indicates either:");
            console.error("❌ PAYMENT_INTENT:   1. Network connectivity issues");
            console.error("❌ PAYMENT_INTENT:   2. Firebase function internal timeout");
            console.error("❌ PAYMENT_INTENT:   3. Firebase function not responding");
            console.error("❌ PAYMENT_INTENT:   4. Firebase function crashed during execution");
          }
          
          // Firebase-specific error analysis
          if (error?.code) {
            console.error("❌ PAYMENT_INTENT: 🔥 FIREBASE ERROR CODE DETECTED 🔥");
            console.error("❌ PAYMENT_INTENT: Firebase error code:", error.code);
            console.error("❌ PAYMENT_INTENT: Firebase error code type:", typeof error.code);
            console.error("❌ PAYMENT_INTENT: Firebase error code analysis:", {
              code: error.code,
              isString: typeof error.code === 'string',
              length: error.code?.length,
              segments: error.code?.split?.('/'),
              hasSlash: error.code?.includes?.('/')
            });
            
            switch (error.code) {
              case 'functions/internal':
                console.error("❌ PAYMENT_INTENT: 🚨 FUNCTIONS/INTERNAL ERROR - CRITICAL 🚨");
                console.error("❌ PAYMENT_INTENT: This means:");
                console.error("❌ PAYMENT_INTENT:   ❗ Function crashed during execution");
                console.error("❌ PAYMENT_INTENT:   ❗ Function timeout (>60s for HTTP calls)");
                console.error("❌ PAYMENT_INTENT:   ❗ Uncaught exception in function code");
                console.error("❌ PAYMENT_INTENT:   ❗ Memory limit exceeded");
                console.error("❌ PAYMENT_INTENT:   ❗ Function deployment issues");
                console.error("❌ PAYMENT_INTENT:   ❗ Missing environment variables");
                console.error("❌ PAYMENT_INTENT:   ❗ External API failures (Stripe, etc.)");
                break;
              case 'functions/not-found':
                console.error("❌ PAYMENT_INTENT: 🚨 FUNCTIONS/NOT-FOUND ERROR 🚨");
                console.error("❌ PAYMENT_INTENT: The 'createPaymentIntent' function doesn't exist or isn't deployed");
                console.error("❌ PAYMENT_INTENT: Check Firebase Console functions tab");
                break;
              case 'functions/permission-denied':
                console.error("❌ PAYMENT_INTENT: 🚨 FUNCTIONS/PERMISSION-DENIED ERROR 🚨");
                console.error("❌ PAYMENT_INTENT: User doesn't have permission to call this function");
                break;
              case 'functions/unauthenticated':
                console.error("❌ PAYMENT_INTENT: 🚨 FUNCTIONS/UNAUTHENTICATED ERROR 🚨");
                console.error("❌ PAYMENT_INTENT: User is not authenticated");
                break;
              default:
                console.error("❌ PAYMENT_INTENT: 🚨 UNKNOWN FIREBASE ERROR CODE 🚨:", error.code);
            }
          }
          
          // Network and environment analysis
          console.error("❌ PAYMENT_INTENT: Environment debug info:", {
            online: navigator.onLine,
            connection: (navigator as any).connection ? {
              effectiveType: (navigator as any).connection.effectiveType,
              downlink: (navigator as any).connection.downlink,
              rtt: (navigator as any).connection.rtt,
              saveData: (navigator as any).connection.saveData
            } : 'not available',
            currentURL: window.location.href,
            origin: window.location.origin,
            protocol: window.location.protocol,
            timestamp: new Date().toISOString()
          });
          
          console.error("❌ PAYMENT_INTENT: Setting error state in React...");
          setIsLoading(false);
          setError(error);
          const processedError = handlePaymentError(error);
          console.error("❌ PAYMENT_INTENT: Processed error for UI:", processedError);
          console.error("❌ PAYMENT_INTENT: ================ FUNCTION CALL ERROR PROCESSING COMPLETED ================");
        });
    } else {
      console.log("🚀 PAYMENT_INTENT: ================ SKIPPING PAYMENT INTENT CREATION ================");
      console.log("🚀 PAYMENT_INTENT: Skip reason analysis:", {
        modalOpen: isOpen,
        hasBookingDetails: !!bookingDetails,
        skipReason: !isOpen ? "Modal not open" : !bookingDetails ? "No booking details" : "Unknown reason"
      });
      console.log("🚀 PAYMENT_INTENT: Current state when skipping:", {
        isOpen,
        hasBookingDetails: !!bookingDetails,
        currentClientSecret: clientSecret || 'empty',
        currentPaymentIntentId: paymentIntentId || 'empty',
        currentIsLoading: isLoading,
        currentError: error?.message || 'none'
      });
    }
  }, [isOpen, bookingDetails]);

  console.log("🚀 PAYMENT_INTENT: Hook returning final state:", {
    timestamp: new Date().toISOString(),
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length || 0,
    hasPaymentIntentId: !!paymentIntentId,
    paymentIntentIdLength: paymentIntentId?.length || 0,
    hasTransactionId: !!transactionId,
    transactionIdLength: transactionId?.length || 0,
    calculatedAmount,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message || 'none',
    errorCode: error?.code || 'none'
  });

  return {
    clientSecret,
    paymentIntentId,
    transactionId,
    calculatedAmount,
    isLoading,
    error
  };
};
