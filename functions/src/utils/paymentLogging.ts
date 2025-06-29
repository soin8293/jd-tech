
import { logger } from "./logger";

export class PaymentLogger {
  private functionId: string;
  private startTime: number;

  constructor(functionName: string) {
    this.functionId = Math.random().toString(36).substring(2, 15);
    this.startTime = Date.now();
    
    console.log(`🚀 ${functionName}: ================ ULTRA VERBOSE FUNCTION EXECUTION START ================`);
    console.log(`🚀 ${functionName}: Function invocation timestamp:`, new Date().toISOString());
    console.log(`🚀 ${functionName}: Function execution ID:`, this.functionId);
    console.log(`🚀 ${functionName}: Node.js version:`, process.version);
    console.log(`🚀 ${functionName}: Platform:`, process.platform);
    console.log(`🚀 ${functionName}: Architecture:`, process.arch);
    console.log(`🚀 ${functionName}: Memory usage:`, process.memoryUsage());
    console.log(`🚀 ${functionName}: Environment variables check:`, {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...',
      nodeEnv: process.env.NODE_ENV,
      gcpProject: process.env.GCP_PROJECT,
      functionName: process.env.FUNCTION_NAME,
      functionRegion: process.env.FUNCTION_REGION
    });
  }

  logRequestAnalysis(request: any, functionName: string) {
    console.log(`🚀 ${functionName}: Request object ultra-detailed analysis:`);
    console.log(`🚀 ${functionName}: Request exists:`, !!request);
    console.log(`🚀 ${functionName}: Request type:`, typeof request);
    console.log(`🚀 ${functionName}: Request constructor:`, request?.constructor?.name);
    console.log(`🚀 ${functionName}: Request keys:`, Object.keys(request || {}));
    
    // Safely stringify request without circular references
    try {
      console.log(`🚀 ${functionName}: Request JSON serialization:`, JSON.stringify(request, null, 2));
    } catch (error) {
      console.log(`🚀 ${functionName}: Request cannot be stringified (circular structure), keys:`, Object.keys(request || {}));
    }
    
    if (request?.data) {
      console.log(`🚀 ${functionName}: Request.data ultra-detailed analysis:`);
      console.log(`🚀 ${functionName}: Data exists:`, !!request.data);
      console.log(`🚀 ${functionName}: Data type:`, typeof request.data);
      console.log(`🚀 ${functionName}: Data constructor:`, request.data?.constructor?.name);
      console.log(`🚀 ${functionName}: Data keys:`, Object.keys(request.data || {}));
      
      try {
        console.log(`🚀 ${functionName}: Data JSON:`, JSON.stringify(request.data, null, 2));
        console.log(`🚀 ${functionName}: Data size (bytes):`, JSON.stringify(request.data).length);
      } catch (error) {
        console.log(`🚀 ${functionName}: Data cannot be stringified, keys:`, Object.keys(request.data || {}));
      }
    } else {
      console.error(`🚀 ${functionName}: ❌ CRITICAL: request.data is missing or falsy!`);
    }
  }

  logValidationStart(functionName: string) {
    console.log(`🚀 ${functionName}: ================ STARTING REQUEST VALIDATION ================`);
    console.log(`🚀 ${functionName}: About to validate request data using schemas.createPaymentIntent...`);
  }

  logValidationSuccess(validatedData: any, functionName: string) {
    console.log(`🚀 ${functionName}: ✅ Request validation successful!`);
    console.log(`🚀 ${functionName}: Validated data structure:`, {
      hasRooms: !!validatedData.rooms,
      roomsCount: validatedData.rooms?.length || 0,
      hasPeriod: !!validatedData.period,
      hasGuests: !!validatedData.guests,
      hasTransactionId: !!validatedData.transaction_id,
      hasCurrency: !!validatedData.currency
    });
    
    try {
      console.log(`🚀 ${functionName}: Validated data JSON:`, JSON.stringify(validatedData, null, 2));
    } catch (error) {
      console.log(`🚀 ${functionName}: Validated data cannot be stringified, structure logged above`);
    }
  }

  logCalculationPhase(phase: string, data: any, functionName: string) {
    console.log(`🚀 ${functionName}: ================ ${phase.toUpperCase()} ================`);
    
    try {
      console.log(`🚀 ${functionName}: ${phase} data:`, JSON.stringify(data, null, 2));
    } catch (error) {
      console.log(`🚀 ${functionName}: ${phase} data cannot be stringified:`, data);
    }
  }

  logSuccess(response: any, functionName: string) {
    const totalExecutionTime = Date.now() - this.startTime;
    console.log(`🚀 ${functionName}: ✅ SUCCESS! Function execution completed!`);
    console.log(`🚀 ${functionName}: Performance summary:`, {
      totalExecutionTime: totalExecutionTime + 'ms',
      totalExecutionSeconds: (totalExecutionTime / 1000).toFixed(2) + 's'
    });
    console.log(`🚀 ${functionName}: Final memory usage:`, process.memoryUsage());
    console.log(`🚀 ${functionName}: ================ FUNCTION EXECUTION COMPLETED SUCCESSFULLY ================`);
  }

  logError(error: any, request: any, functionName: string) {
    console.error(`🚀 ${functionName}: ❌❌❌ ULTRA CRITICAL ERROR OCCURRED! ❌❌❌`);
    console.error(`🚀 ${functionName}: Error timestamp:`, new Date().toISOString());
    console.error(`🚀 ${functionName}: Error in function execution context`);
    
    // Log only serializable error properties
    console.error(`🚀 ${functionName}: Error analysis:`, {
      errorExists: !!error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorName: error?.name
    });
    
    logger.error("!!! UNHANDLED EXCEPTION IN createPaymentIntentHandler !!!", {
      errorMessage: error.message,
      errorCode: error.code,
      errorType: error.constructor.name,
      requestDataKeys: request?.data ? Object.keys(request.data) : [],
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage()
    });
  }
}
