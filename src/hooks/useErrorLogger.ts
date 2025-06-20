
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityAuditLogger } from '@/hooks/useSecurityAuditLogger';

export interface ErrorLogEntry {
  errorId: string;
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const useErrorLogger = () => {
  const { currentUser } = useAuth();
  const { logSecurityEvent } = useSecurityAuditLogger();

  const sanitizeErrorMessage = useCallback((message: string): string => {
    return message
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]')
      .replace(/\btoken[=:]\s*[\w\.-]+/gi, 'token=[TOKEN_REDACTED]')
      .replace(/\bapi[_-]?key[=:]\s*[\w\.-]+/gi, 'api_key=[KEY_REDACTED]');
  }, []);

  const logError = useCallback((
    error: Error | string,
    severity: ErrorLogEntry['severity'] = 'MEDIUM',
    component?: string,
    additionalDetails?: Record<string, any>
  ) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' && error.stack ? error.stack : undefined;

    const errorLog: ErrorLogEntry = {
      errorId,
      message: sanitizeErrorMessage(message),
      stack: stack ? sanitizeErrorMessage(stack) : undefined,
      component,
      userId: currentUser?.uid,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity
    };

    // Log to security audit system
    logSecurityEvent({
      type: 'FAILED_ACCESS',
      action: 'APPLICATION_ERROR',
      resource: component || 'unknown_component',
      details: {
        ...errorLog,
        ...additionalDetails
      },
      severity
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🔒 APPLICATION ERROR:', errorLog);
    }

    // Store for debugging (limit to last 50 errors)
    try {
      const existingLogs = JSON.parse(sessionStorage.getItem('error_logs') || '[]');
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 50);
      sessionStorage.setItem('error_logs', JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }

    return errorId;
  }, [currentUser, sanitizeErrorMessage, logSecurityEvent]);

  const logNetworkError = useCallback((
    url: string,
    method: string,
    status: number,
    message: string
  ) => {
    logError(
      `Network Error: ${method} ${url} - ${status} ${message}`,
      status >= 500 ? 'HIGH' : 'MEDIUM',
      'NetworkLayer',
      {
        url,
        method,
        status,
        type: 'network_error'
      }
    );
  }, [logError]);

  const logValidationError = useCallback((
    field: string,
    value: any,
    validationRule: string
  ) => {
    logError(
      `Validation Error: ${field} failed ${validationRule}`,
      'LOW',
      'ValidationLayer',
      {
        field,
        validationRule,
        type: 'validation_error'
      }
    );
  }, [logError]);

  const getErrorLogs = useCallback((): ErrorLogEntry[] => {
    try {
      return JSON.parse(sessionStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  }, []);

  const clearErrorLogs = useCallback(() => {
    sessionStorage.removeItem('error_logs');
  }, []);

  return {
    logError,
    logNetworkError,
    logValidationError,
    getErrorLogs,
    clearErrorLogs
  };
};
