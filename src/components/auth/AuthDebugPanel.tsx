import React, { useState } from 'react';
import { useAuthDebug } from '@/contexts/AuthDebugContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Bug, 
  Trash2, 
  Download, 
  RefreshCw, 
  User,
  Clock,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const AuthDebugPanel = () => {
  const { debugMode, toggleDebugMode, logs, clearLogs, traceId, requestId } = useAuthDebug();
  const { currentUser, isAdmin, isLoading, authInitialized } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const exportLogs = () => {
    const logsJson = JSON.stringify(logs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'WARN':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'INFO':
        return <Info className="h-3 w-3 text-blue-500" />;
      case 'DEBUG':
        return <CheckCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'destructive';
      case 'WARN':
        return 'outline';
      case 'INFO':
        return 'default';
      case 'DEBUG':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!debugMode && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="border-2 border-dashed border-orange-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  <CardTitle className="text-sm">Auth Debug Panel</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {logs.length} logs
                  </Badge>
                  <Switch
                    checked={debugMode}
                    onCheckedChange={toggleDebugMode}
                  />
                </div>
              </div>
              <CardDescription className="text-xs">
                Trace: {traceId.slice(-8)} | Request: {requestId.slice(-8)}
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Auth Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Auth Status</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className={currentUser ? 'text-green-600' : 'text-red-600'}>
                      {currentUser ? 'Signed In' : 'Not Signed In'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                      {isAdmin ? 'Admin' : 'User'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
                      {isLoading ? 'Loading' : 'Ready'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span className={authInitialized ? 'text-green-600' : 'text-yellow-600'}>
                      {authInitialized ? 'Initialized' : 'Initializing'}
                    </span>
                  </div>
                </div>
                {currentUser && (
                  <div className="text-xs text-muted-foreground">
                    User: {currentUser.email}
                  </div>
                )}
              </div>

              <Separator />

              {/* Controls */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                  className="text-xs"
                  disabled={logs.length === 0}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportLogs}
                  className="text-xs"
                  disabled={logs.length === 0}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reload
                </Button>
              </div>

              <Separator />

              {/* Logs */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Logs</h4>
                <ScrollArea className="h-48 w-full border rounded">
                  <div className="p-2 space-y-1">
                    {logs.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No logs yet. Interact with auth to see logs.
                      </div>
                    ) : (
                      logs.slice(-20).reverse().map((log, index) => (
                        <div
                          key={index}
                          className="text-xs p-2 rounded border bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {getLogIcon(log.level)}
                              <Badge 
                                variant={getLogLevelColor(log.level) as any}
                                className="text-xs px-1 py-0"
                              >
                                {log.level}
                              </Badge>
                              <span className="font-mono text-muted-foreground">
                                {log.functionName}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mt-1 text-foreground">
                            {log.message}
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Metadata
                              </summary>
                              <pre className="mt-1 text-xs bg-muted p-1 rounded overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default AuthDebugPanel;