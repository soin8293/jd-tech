
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SecurityEvent {
  type: 'ADMIN_ACTION' | 'AUTH_EVENT' | 'DATA_ACCESS' | 'PERMISSION_CHANGE' | 'FAILED_ACCESS';
  action: string;
  resource?: string;
  details?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress?: string;
  userAgent?: string;
}

export const useSecurityAuditLogger = () => {
  const { currentUser, isAdmin } = useAuth();

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    try {
      // Get client information
      const clientInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        url: window.location.href,
        referrer: document.referrer
      };

      const auditRecord = {
        ...event,
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        isAdmin: isAdmin,
        timestamp: serverTimestamp(),
        clientInfo,
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      };

      await addDoc(collection(db, 'securityAuditLog'), auditRecord);
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 SECURITY AUDIT:', auditRecord);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failures shouldn't break app functionality
    }
  }, [currentUser, isAdmin]);

  // Convenience methods for common events
  const logAdminAction = useCallback((action: string, resource: string, details?: Record<string, any>) => {
    logSecurityEvent({
      type: 'ADMIN_ACTION',
      action,
      resource,
      details,
      severity: 'MEDIUM'
    });
  }, [logSecurityEvent]);

  const logFailedAccess = useCallback((resource: string, reason: string) => {
    logSecurityEvent({
      type: 'FAILED_ACCESS',
      action: 'ACCESS_DENIED',
      resource,
      details: { reason },
      severity: 'HIGH'
    });
  }, [logSecurityEvent]);

  const logAuthEvent = useCallback((action: string, details?: Record<string, any>) => {
    logSecurityEvent({
      type: 'AUTH_EVENT',
      action,
      details,
      severity: action.includes('FAILED') ? 'HIGH' : 'LOW'
    });
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    logAdminAction,
    logFailedAccess,
    logAuthEvent
  };
};
