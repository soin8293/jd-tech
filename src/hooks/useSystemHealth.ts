
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { logger } from "@/utils/logger";

export interface HealthStatus {
  database: 'healthy' | 'warning' | 'error' | 'unknown';
  api: 'healthy' | 'warning' | 'error' | 'unknown';
  sessions: 'healthy' | 'warning' | 'error' | 'unknown';
  backups: 'healthy' | 'warning' | 'error' | 'unknown';
}

export interface HealthAlert {
  message: string;
  severity: 'warning' | 'error';
  timestamp: Date;
  component: keyof HealthStatus;
}

export const useSystemHealth = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    database: 'unknown',
    api: 'unknown',
    sessions: 'unknown',
    backups: 'unknown'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);

  // Check database health
  const checkDatabaseHealth = useCallback(async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      const startTime = performance.now();
      const testQuery = query(collection(db, 'rooms'), limit(1));
      await getDocs(testQuery);
      const responseTime = performance.now() - startTime;
      
      if (responseTime > 5000) return 'warning'; // Slow response
      if (responseTime > 10000) return 'error'; // Very slow response
      return 'healthy';
    } catch (error) {
      logger.error('Database health check failed', error);
      return 'error';
    }
  }, []);

  // Check API health by testing a simple function call
  const checkAPIHealth = useCallback(async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      const startTime = performance.now();
      
      // Test a simple API endpoint or function
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const responseTime = performance.now() - startTime;
      
      if (!response.ok) return 'error';
      if (responseTime > 2000) return 'warning'; // Slow API
      if (responseTime > 5000) return 'error'; // Very slow API
      
      return 'healthy';
    } catch (error) {
      logger.error('API health check failed', error);
      return 'error';
    }
  }, []);

  // Check session health (memory usage, active sessions)
  const checkSessionHealth = useCallback(async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      // Check if we have too many stored sessions
      const storedSessions = Object.keys(sessionStorage).length;
      const localStorageUsage = JSON.stringify(localStorage).length;
      
      if (storedSessions > 50) return 'warning';
      if (localStorageUsage > 5000000) return 'warning'; // 5MB
      
      return 'healthy';
    } catch (error) {
      logger.error('Session health check failed', error);
      return 'error';
    }
  }, []);

  // Check backup verification
  const checkBackupHealth = useCallback(async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      // Check if we have recent backup metadata
      const lastBackup = localStorage.getItem('lastBackupTimestamp');
      if (!lastBackup) return 'warning';
      
      const lastBackupTime = new Date(lastBackup);
      const hoursSinceBackup = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceBackup > 48) return 'error'; // No backup in 48 hours
      if (hoursSinceBackup > 24) return 'warning'; // No backup in 24 hours
      
      return 'healthy';
    } catch (error) {
      logger.error('Backup health check failed', error);
      return 'error';
    }
  }, []);

  // Perform comprehensive health check
  const performHealthCheck = useCallback(async () => {
    setIsLoading(true);
    console.log('🏥 HEALTH: Starting system health check...');
    
    try {
      const [databaseStatus, apiStatus, sessionStatus, backupStatus] = await Promise.all([
        checkDatabaseHealth(),
        checkAPIHealth(),
        checkSessionHealth(),
        checkBackupHealth()
      ]);

      const newStatus: HealthStatus = {
        database: databaseStatus,
        api: apiStatus,
        sessions: sessionStatus,
        backups: backupStatus
      };

      setHealthStatus(newStatus);
      setLastCheck(new Date());

      // Generate alerts for any issues
      const newAlerts: HealthAlert[] = [];
      
      if (databaseStatus === 'error') {
        newAlerts.push({
          message: 'Database connection failed',
          severity: 'error',
          timestamp: new Date(),
          component: 'database'
        });
      } else if (databaseStatus === 'warning') {
        newAlerts.push({
          message: 'Database responding slowly',
          severity: 'warning',
          timestamp: new Date(),
          component: 'database'
        });
      }

      if (apiStatus === 'error') {
        newAlerts.push({
          message: 'API endpoints not responding',
          severity: 'error',
          timestamp: new Date(),
          component: 'api'
        });
      } else if (apiStatus === 'warning') {
        newAlerts.push({
          message: 'API response times are slow',
          severity: 'warning',
          timestamp: new Date(),
          component: 'api'
        });
      }

      if (sessionStatus === 'warning') {
        newAlerts.push({
          message: 'High session storage usage detected',
          severity: 'warning',
          timestamp: new Date(),
          component: 'sessions'
        });
      }

      if (backupStatus === 'error') {
        newAlerts.push({
          message: 'Backup verification failed - no recent backups found',
          severity: 'error',
          timestamp: new Date(),
          component: 'backups'
        });
      } else if (backupStatus === 'warning') {
        newAlerts.push({
          message: 'Backup is overdue',
          severity: 'warning',
          timestamp: new Date(),
          component: 'backups'
        });
      }

      setAlerts(prev => [...prev, ...newAlerts]);
      
      console.log('🏥 HEALTH: Health check completed:', newStatus);
      logger.info('System health check completed', newStatus);
      
    } catch (error) {
      logger.error('Health check failed', error);
      console.error('🏥 HEALTH: Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checkDatabaseHealth, checkAPIHealth, checkSessionHealth, checkBackupHealth]);

  // Auto-refresh health status
  useEffect(() => {
    performHealthCheck();
    
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(performHealthCheck, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [performHealthCheck]);

  const refreshHealth = useCallback(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  const clearAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    healthStatus,
    isLoading,
    lastCheck,
    alerts,
    refreshHealth,
    clearAlert
  };
};
