
import { useCallback } from 'react';
import { sanitizeString, sanitizeHtml } from '@/utils/inputValidation';
import { useSecurityAuditLogger } from './useSecurityAuditLogger';

export const useInputSanitization = () => {
  const { logSecurityEvent } = useSecurityAuditLogger();

  const sanitizeAndLog = useCallback((input: string, fieldName: string, type: 'string' | 'html' = 'string') => {
    const sanitized = type === 'html' ? sanitizeHtml(input) : sanitizeString(input);
    
    // Log potential XSS attempts
    if (sanitized !== input) {
      logSecurityEvent({
        type: 'FAILED_ACCESS',
        action: 'XSS_ATTEMPT_BLOCKED',
        resource: fieldName,
        details: {
          originalLength: input.length,
          sanitizedLength: sanitized.length,
          fieldName
        },
        severity: 'HIGH'
      });
    }
    
    return sanitized;
  }, [logSecurityEvent]);

  const sanitizeObject = useCallback((obj: Record<string, any>, sanitizationRules: Record<string, 'string' | 'html'>) => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && sanitizationRules[key]) {
        sanitized[key] = sanitizeAndLog(value, key, sanitizationRules[key]);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }, [sanitizeAndLog]);

  return {
    sanitizeString: (input: string, fieldName: string) => sanitizeAndLog(input, fieldName, 'string'),
    sanitizeHtml: (input: string, fieldName: string) => sanitizeAndLog(input, fieldName, 'html'),
    sanitizeObject
  };
};
