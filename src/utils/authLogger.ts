import { v4 as uuidv4 } from 'uuid';

export interface AuthLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  requestId: string;
  userId?: string;
  functionName: string;
  message: string;
  metadata?: Record<string, any>;
  traceId?: string;
}

class AuthLogger {
  private requestId: string;
  private traceId: string;
  private userId?: string;

  constructor() {
    this.requestId = this.generateRequestId();
    this.traceId = this.generateTraceId();
  }

  private generateRequestId(): string {
    return `req_${uuidv4().slice(0, 8)}`;
  }

  private generateTraceId(): string {
    return `trace_${uuidv4()}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  getTraceId(): string {
    return this.traceId;
  }

  getRequestId(): string {
    return this.requestId;
  }

  private createLogEntry(
    level: AuthLogEntry['level'],
    functionName: string,
    message: string,
    metadata?: Record<string, any>
  ): AuthLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.requestId,
      userId: this.userId,
      functionName,
      message,
      metadata,
      traceId: this.traceId,
    };
  }

  private log(entry: AuthLogEntry) {
    // Console logging with structured format
    const logMessage = `[${entry.level}] ${entry.timestamp} [${entry.functionName}] ${entry.message}`;
    const logData = {
      ...entry,
      metadata: entry.metadata || {},
    };

    switch (entry.level) {
      case 'ERROR':
        console.error(logMessage, logData);
        break;
      case 'WARN':
        console.warn(logMessage, logData);
        break;
      case 'DEBUG':
        console.debug(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }

    // In production, this would send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogging(entry);
    }
  }

  private sendToExternalLogging(entry: AuthLogEntry) {
    // This would integrate with Sentry, Datadog, etc.
    // For now, we'll store in sessionStorage for debugging
    try {
      const logs = JSON.parse(sessionStorage.getItem('auth_logs') || '[]');
      logs.push(entry);
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      sessionStorage.setItem('auth_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  info(functionName: string, message: string, metadata?: Record<string, any>) {
    this.log(this.createLogEntry('INFO', functionName, message, metadata));
  }

  warn(functionName: string, message: string, metadata?: Record<string, any>) {
    this.log(this.createLogEntry('WARN', functionName, message, metadata));
  }

  error(functionName: string, message: string, metadata?: Record<string, any>) {
    this.log(this.createLogEntry('ERROR', functionName, message, metadata));
  }

  debug(functionName: string, message: string, metadata?: Record<string, any>) {
    this.log(this.createLogEntry('DEBUG', functionName, message, metadata));
  }

  // Performance monitoring
  startTimer(operationName: string): () => void {
    const startTime = performance.now();
    this.debug('AuthLogger.startTimer', `Starting timer for ${operationName}`, {
      operationName,
      startTime,
    });

    return () => {
      const duration = performance.now() - startTime;
      this.info('AuthLogger.endTimer', `Completed ${operationName}`, {
        operationName,
        duration: `${duration.toFixed(2)}ms`,
      });
    };
  }

  // Assertion helper
  assert(condition: boolean, message: string, metadata?: Record<string, any>): void {
    if (!condition) {
      this.error('AuthLogger.assert', `Assertion failed: ${message}`, metadata);
      
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Auth Assertion Failed: ${message}`);
      }
    }
  }

  // Get all logs for debugging
  getLogs(): AuthLogEntry[] {
    try {
      return JSON.parse(sessionStorage.getItem('auth_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear logs
  clearLogs() {
    sessionStorage.removeItem('auth_logs');
  }
}

// Singleton instance
export const authLogger = new AuthLogger();

// Helper for creating performance markers
export const withAuthPerformanceMarker = <T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T => {
  return ((...args: any[]) => {
    const endTimer = authLogger.startTimer(operationName);
    try {
      const result = fn(...args);
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result.finally(endTimer);
      } else {
        endTimer();
        return result;
      }
    } catch (error) {
      endTimer();
      throw error;
    }
  }) as T;
};
