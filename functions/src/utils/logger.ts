
import * as functions from "firebase-functions";

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

interface LogContext {
  function?: string;
  userId?: string;
  transactionId?: string;
  bookingId?: string;
  paymentIntentId?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0 
      ? ` [${Object.entries(this.context).map(([k, v]) => `${k}:${v}`).join(', ')}]` 
      : '';
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}`;
    
    if (data) {
      logMessage += ` - ${JSON.stringify(data, null, 2)}`;
    }
    
    return logMessage;
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  error(message: string, error?: any) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      ...(typeof error === 'object' ? error : {})
    } : undefined;
    
    console.error(this.formatMessage(LogLevel.ERROR, message, errorData));
  }

  debug(message: string, data?: any) {
    // Use modern Firebase Functions v2 environment variable approach
    const debugEnabled = process.env.DEBUG === 'true';
    if (debugEnabled) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }
}

export const logger = new Logger();
