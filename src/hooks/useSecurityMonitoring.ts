
import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityAuditLogger } from '@/hooks/useSecurityAuditLogger';

export const useSecurityMonitoring = () => {
  const { currentUser, isAdmin } = useAuth();
  const { logSecurityEvent, logFailedAccess, logAuthEvent } = useSecurityAuditLogger();

  // Monitor page navigation for suspicious activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent({
          type: 'AUTH_EVENT',
          action: 'PAGE_HIDDEN',
          details: {
            url: window.location.href,
            timestamp: new Date().toISOString()
          },
          severity: 'LOW'
        });
      } else {
        logSecurityEvent({
          type: 'AUTH_EVENT',
          action: 'PAGE_VISIBLE',
          details: {
            url: window.location.href,
            timestamp: new Date().toISOString()
          },
          severity: 'LOW'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [logSecurityEvent]);

  // Monitor failed form submissions
  const monitorFormSubmission = useCallback((formType: string, success: boolean, details?: any) => {
    if (!success) {
      logFailedAccess(formType, 'Form validation failed');
    } else {
      logSecurityEvent({
        type: 'DATA_ACCESS',
        action: 'FORM_SUBMITTED',
        resource: formType,
        details,
        severity: 'LOW'
      });
    }
  }, [logFailedAccess, logSecurityEvent]);

  // Monitor admin actions
  const monitorAdminAction = useCallback((action: string, resource: string, details?: any) => {
    if (!isAdmin) {
      logFailedAccess(resource, 'Unauthorized admin action attempt');
      return;
    }

    logSecurityEvent({
      type: 'ADMIN_ACTION',
      action,
      resource,
      details: {
        ...details,
        adminUserId: currentUser?.uid,
        adminEmail: currentUser?.email
      },
      severity: 'MEDIUM'
    });
  }, [isAdmin, currentUser, logFailedAccess, logSecurityEvent]);

  // Monitor booking modifications
  const monitorBookingAction = useCallback((action: string, bookingId: string, details?: any) => {
    logSecurityEvent({
      type: 'DATA_ACCESS',
      action: `BOOKING_${action.toUpperCase()}`,
      resource: 'booking',
      details: {
        bookingId,
        ...details
      },
      severity: action === 'DELETE' ? 'HIGH' : 'MEDIUM'
    });
  }, [logSecurityEvent]);

  // Monitor authentication events
  const monitorAuthEvent = useCallback((event: string, success: boolean, details?: any) => {
    logAuthEvent(success ? event : `${event}_FAILED`, {
      success,
      timestamp: new Date().toISOString(),
      ...details
    });
  }, [logAuthEvent]);

  // Monitor suspicious activity patterns
  const monitorSuspiciousActivity = useCallback((activityType: string, details: any) => {
    logSecurityEvent({
      type: 'FAILED_ACCESS',
      action: 'SUSPICIOUS_ACTIVITY_DETECTED',
      resource: activityType,
      details: {
        ...details,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      },
      severity: 'HIGH'
    });
  }, [logSecurityEvent]);

  return {
    monitorFormSubmission,
    monitorAdminAction,
    monitorBookingAction,
    monitorAuthEvent,
    monitorSuspiciousActivity
  };
};
