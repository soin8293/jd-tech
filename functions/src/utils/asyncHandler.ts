import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "./logger";

/**
 * Async wrapper for Firebase Cloud Functions that handles errors consistently
 */
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  functionName: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      logger.setContext({ function: functionName });
      logger.info(`Function ${functionName} started`);
      
      const result = await fn(...args);
      
      logger.info(`Function ${functionName} completed successfully`);
      return result;
    } catch (error: any) {
      logger.error(`Function ${functionName} failed`, error);
      
      // If it's already an HttpsError, re-throw it
      if (error instanceof HttpsError) {
        throw error;
      }
      
      // Convert generic errors to HttpsError
      throw new HttpsError(
        'internal',
        error.message || `${functionName} failed`,
        { 
          type: 'internal_error', 
          originalError: error.message,
          functionName 
        }
      );
    } finally {
      logger.clearContext();
    }
  };
};