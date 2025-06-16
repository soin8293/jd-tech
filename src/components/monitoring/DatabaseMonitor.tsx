
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Activity, 
  Clock, 
  Users, 
  FileText,
  RefreshCw 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

interface DatabaseStats {
  connectionStatus: 'connected' | 'disconnected' | 'slow';
  responseTime: number;
  activeConnections: number;
  totalDocuments: number;
  lastResponse: Date | null;
  errorRate: number;
}

export const DatabaseMonitor: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats>({
    connectionStatus: 'disconnected',
    responseTime: 0,
    activeConnections: 0,
    totalDocuments: 0,
    lastResponse: null,
    errorRate: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    console.log('🔍 DB_MONITOR: Testing database connection...');
    
    try {
      const startTime = performance.now();
      
      // Test basic connection with room count
      const roomsQuery = query(collection(db, 'rooms'), limit(100));
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomCount = roomsSnapshot.size;
      
      // Test additional collections
      const usersQuery = query(collection(db, 'users'), limit(10));
      const usersSnapshot = await getDocs(usersQuery);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let connectionStatus: 'connected' | 'slow' = 'connected';
      if (responseTime > 2000) connectionStatus = 'slow';
      
      setStats({
        connectionStatus,
        responseTime,
        activeConnections: 1, // Simulated
        totalDocuments: roomCount + usersSnapshot.size,
        lastResponse: new Date(),
        errorRate: 0
      });
      
      console.log('🔍 DB_MONITOR: Connection test successful:', {
        responseTime,
        roomCount,
        status: connectionStatus
      });
      
    } catch (error) {
      console.error('🔍 DB_MONITOR: Connection test failed:', error);
      setStats(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        lastResponse: new Date(),
        errorRate: prev.errorRate + 1
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testDatabaseConnection();
    
    // Test every 30 seconds
    const interval = setInterval(testDatabaseConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'slow': return 'secondary';
      case 'disconnected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection Monitor
            </CardTitle>
            <CardDescription>
              Real-time database health and performance metrics
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={testDatabaseConnection}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <Badge variant={getStatusColor(stats.connectionStatus) as any}>
              {stats.connectionStatus.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Response Time</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.responseTime.toFixed(0)}ms
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Documents</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.totalDocuments}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Error Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.errorRate}%
            </div>
          </div>
        </div>
        
        {/* Response Time Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Response Time Performance</span>
            <span>{stats.responseTime.toFixed(0)}ms</span>
          </div>
          <Progress 
            value={Math.min((stats.responseTime / 3000) * 100, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fast (0ms)</span>
            <span>Slow (3000ms+)</span>
          </div>
        </div>
        
        {stats.lastResponse && (
          <div className="text-xs text-muted-foreground">
            Last checked: {stats.lastResponse.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
