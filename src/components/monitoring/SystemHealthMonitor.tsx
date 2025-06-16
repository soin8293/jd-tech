
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Clock, 
  Users, 
  Archive, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  Server,
  Wifi
} from "lucide-react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { DatabaseMonitor } from "./DatabaseMonitor";
import { APIResponseTracker } from "./APIResponseTracker";
import { UserSessionAnalytics } from "./UserSessionAnalytics";
import { BackupVerification } from "./BackupVerification";

interface SystemHealthMonitorProps {
  className?: string;
}

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  className = ""
}) => {
  const {
    healthStatus,
    isLoading,
    lastCheck,
    refreshHealth,
    alerts,
    clearAlert
  } = useSystemHealth();

  const getOverallStatus = () => {
    if (isLoading) return { status: 'checking', color: 'secondary' };
    
    const hasErrors = Object.values(healthStatus).some(status => status === 'error');
    const hasWarnings = Object.values(healthStatus).some(status => status === 'warning');
    
    if (hasErrors) return { status: 'error', color: 'destructive' };
    if (hasWarnings) return { status: 'warning', color: 'secondary' };
    return { status: 'healthy', color: 'default' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Health Dashboard
              </CardTitle>
              <CardDescription>
                Real-time monitoring of all system components
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={overallStatus.color as any}>
                {overallStatus.status === 'checking' && <RefreshCw className="h-3 w-3 animate-spin mr-1" />}
                {overallStatus.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                {overallStatus.status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {overallStatus.status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {overallStatus.status.toUpperCase()}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={refreshHealth}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Database</span>
              <Badge variant={healthStatus.database === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.database || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">API</span>
              <Badge variant={healthStatus.api === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.api || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Sessions</span>
              <Badge variant={healthStatus.sessions === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.sessions || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <span className="text-sm">Backups</span>
              <Badge variant={healthStatus.backups === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.backups || 'Unknown'}
              </Badge>
            </div>
          </div>
          
          {lastCheck && (
            <p className="text-xs text-muted-foreground mt-4">
              Last check: {lastCheck.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{alert.message}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => clearAlert(index)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="sessions">User Sessions</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database" className="mt-4">
          <DatabaseMonitor />
        </TabsContent>
        
        <TabsContent value="api" className="mt-4">
          <APIResponseTracker />
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-4">
          <UserSessionAnalytics />
        </TabsContent>
        
        <TabsContent value="backups" className="mt-4">
          <BackupVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealthMonitor;
