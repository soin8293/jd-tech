
import { useCallback } from 'react';
import { sanitizeString, sanitizeHtml } from '@/utils/inputValidation';
// Removed useSecurityAuditLogger dependency

export const useInputSanitization = () => {
  // Simplified sanitization without logging

  const sanitizeAndLog = useCallback((input: string, fieldName: string, type: 'string' | 'html' = 'string') => {
    const sanitized = type === 'html' ? sanitizeHtml(input) : sanitizeString(input);
    return sanitized;
  }, []);

  const sanitizeObject = useCallback(<T extends Record<string, any>>(
    obj: T, 
    sanitizationRules: Record<string, 'string' | 'html'>
  ): T => {
    const sanitized = { ...obj };
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && sanitizationRules[key]) {
        (sanitized as any)[key] = sanitizeAndLog(value, key, sanitizationRules[key]);
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
