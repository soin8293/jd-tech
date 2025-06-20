
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SessionState {
  lastActivity: number;
  sessionStart: number;
  warningShown: boolean;
}

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

export const useSessionManager = () => {
  const { currentUser, logout } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>({
    lastActivity: Date.now(),
    sessionStart: Date.now(),
    warningShown: false
  });

  // Track user activity
  const updateActivity = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      lastActivity: Date.now(),
      warningShown: false
    }));
  }, []);

  // Handle session timeout
  const handleSessionTimeout = useCallback(async () => {
    toast({
      title: "Session Expired",
      description: "You have been logged out due to inactivity",
      variant: "destructive",
    });
    await logout();
  }, [logout]);

  // Show timeout warning
  const showTimeoutWarning = useCallback(() => {
    if (!sessionState.warningShown) {
      setSessionState(prev => ({ ...prev, warningShown: true }));
      toast({
        title: "Session Expiring Soon",
        description: "Your session will expire in 5 minutes due to inactivity",
        variant: "destructive",
      });
    }
  }, [sessionState.warningShown]);

  // Monitor session activity
  useEffect(() => {
    if (!currentUser) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [currentUser, updateActivity]);

  // Session timeout monitoring
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - sessionState.lastActivity;

      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        handleSessionTimeout();
      } else if (timeSinceLastActivity >= SESSION_TIMEOUT - WARNING_TIME && !sessionState.warningShown) {
        showTimeoutWarning();
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [currentUser, sessionState, handleSessionTimeout, showTimeoutWarning]);

  return {
    sessionState,
    updateActivity,
    timeUntilExpiry: SESSION_TIMEOUT - (Date.now() - sessionState.lastActivity)
  };
};
