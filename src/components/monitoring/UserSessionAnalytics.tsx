
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Clock, 
  Activity, 
  BarChart3,
  Eye,
  RefreshCw 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SessionMetrics {
  activeUsers: number;
  averageSessionDuration: number;
  totalSessions: number;
  bounceRate: number;
  memoryUsage: number;
  storageUsage: number;
}

export const UserSessionAnalytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState<SessionMetrics>({
    activeUsers: 0,
    averageSessionDuration: 0,
    totalSessions: 0,
    bounceRate: 0,
    memoryUsage: 0,
    storageUsage: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const calculateSessionMetrics = () => {
    setIsLoading(true);
    console.log('👥 SESSION_ANALYTICS: Calculating session metrics...');
    
    try {
      // Calculate session start time
      const sessionStart = sessionStorage.getItem('sessionStartTime');
      const currentTime = Date.now();
      const sessionDuration = sessionStart 
        ? (currentTime - parseInt(sessionStart)) / 1000 / 60 // minutes
        : 0;
      
      // Calculate storage usage
      let localStorageSize = 0;
      let sessionStorageSize = 0;
      
      try {
        localStorageSize = new Blob(Object.values(localStorage)).size;
        sessionStorageSize = new Blob(Object.values(sessionStorage)).size;
      } catch (error) {
        console.warn('Storage size calculation failed:', error);
      }
      
      // Estimate memory usage (approximate)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Simulate some metrics (in a real app, these would come from analytics)
      const newMetrics: SessionMetrics = {
        activeUsers: currentUser ? 1 : 0,
        averageSessionDuration: sessionDuration,
        totalSessions: parseInt(localStorage.getItem('totalSessions') || '1'),
        bounceRate: 15, // Simulated
        memoryUsage: memoryUsage / (1024 * 1024), // Convert to MB
        storageUsage: (localStorageSize + sessionStorageSize) / 1024 // Convert to KB
      };
      
      setMetrics(newMetrics);
      
      console.log('👥 SESSION_ANALYTICS: Metrics calculated:', newMetrics);
      
    } catch (error) {
      console.error('👥 SESSION_ANALYTICS: Metrics calculation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSession = () => {
    // Track session start if not already tracked
    if (!sessionStorage.getItem('sessionStartTime')) {
      sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }
    
    // Increment total sessions
    const totalSessions = parseInt(localStorage.getItem('totalSessions') || '0') + 1;
    localStorage.setItem('totalSessions', totalSessions.toString());
  };

  useEffect(() => {
    initializeSession();
    calculateSessionMetrics();
    
    // Update metrics every minute
    const interval = setInterval(calculateSessionMetrics, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const getUsageColor = (usage: number, threshold: number) => {
    if (usage > threshold * 0.8) return 'destructive';
    if (usage > threshold * 0.6) return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Session Analytics
            </CardTitle>
            <CardDescription>
              Monitor user engagement and session performance
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={calculateSessionMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Session Duration</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.averageSessionDuration.toFixed(1)}m
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Total Sessions</span>
            </div>
            <div className="text-2xl font-bold">{metrics.totalSessions}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Bounce Rate</span>
            </div>
            <div className="text-2xl font-bold">{metrics.bounceRate}%</div>
          </div>
        </div>
        
        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Memory Usage</span>
            <span>{metrics.memoryUsage.toFixed(1)} MB</span>
          </div>
          <Progress 
            value={Math.min((metrics.memoryUsage / 100) * 100, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Optimal (&lt;50MB)</span>
            <span>High (100MB+)</span>
          </div>
        </div>
        
        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Local Storage Usage</span>
            <span>{metrics.storageUsage.toFixed(1)} KB</span>
          </div>
          <Progress 
            value={Math.min((metrics.storageUsage / 5000) * 100, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimal (&lt;1MB)</span>
            <span>High (5MB+)</span>
          </div>
        </div>
        
        {/* Session Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Current Session Status</span>
          <Badge variant={currentUser ? 'default' : 'secondary'}>
            {currentUser ? 'Authenticated' : 'Anonymous'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
