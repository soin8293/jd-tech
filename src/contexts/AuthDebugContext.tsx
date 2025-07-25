import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authLogger, AuthLogEntry } from '@/utils/authLogger';

interface AuthDebugContextType {
  debugMode: boolean;
  toggleDebugMode: () => void;
  logs: AuthLogEntry[];
  clearLogs: () => void;
  traceId: string;
  requestId: string;
}

const AuthDebugContext = createContext<AuthDebugContextType | undefined>(undefined);

export function AuthDebugProvider({ children }: { children: ReactNode }) {
  // Ensure React is properly available before using hooks
  if (!React || typeof React.useState !== 'function') {
    console.error('AuthDebugProvider: React hooks are not available');
    return <div>Error: React not properly initialized</div>;
  }

  const [debugMode, setDebugMode] = useState(() => {
    try {
      return localStorage.getItem('authDebugMode') === 'true' || 
             process.env.NODE_ENV === 'development';
    } catch (error) {
      console.warn('AuthDebugProvider: localStorage access failed, defaulting to false');
      return false;
    }
  });
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);

  const toggleDebugMode = () => {
    try {
      const newMode = !debugMode;
      setDebugMode(newMode);
      localStorage.setItem('authDebugMode', newMode.toString());
      
      authLogger.info('AuthDebugContext.toggleDebugMode', `Debug mode ${newMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('AuthDebugProvider: toggleDebugMode failed', error);
    }
  };

  const clearLogs = () => {
    try {
      authLogger.clearLogs();
      setLogs([]);
      authLogger.info('AuthDebugContext.clearLogs', 'Auth logs cleared');
    } catch (error) {
      console.error('AuthDebugProvider: clearLogs failed', error);
    }
  };

  useEffect(() => {
    if (debugMode) {
      // Refresh logs periodically in debug mode
      const interval = setInterval(() => {
        setLogs(authLogger.getLogs());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [debugMode]);

  // Global error handler for auth-related errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message?.includes('auth')) {
        authLogger.error('AuthDebugContext.globalErrorHandler', 'Uncaught auth-related error', {
          message: event.error.message,
          stack: event.error.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && JSON.stringify(event.reason).includes('auth')) {
        authLogger.error('AuthDebugContext.unhandledRejection', 'Unhandled auth promise rejection', {
          reason: event.reason,
          promise: event.promise,
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const value = {
    debugMode,
    toggleDebugMode,
    logs,
    clearLogs,
    traceId: authLogger.getTraceId(),
    requestId: authLogger.getRequestId(),
  };

  return (
    <AuthDebugContext.Provider value={value}>
      {children}
    </AuthDebugContext.Provider>
  );
}

export function useAuthDebug() {
  const context = useContext(AuthDebugContext);
  if (context === undefined) {
    throw new Error('useAuthDebug must be used within an AuthDebugProvider');
  }
  return context;
}