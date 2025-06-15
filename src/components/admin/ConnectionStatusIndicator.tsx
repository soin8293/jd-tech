import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Upload
} from "lucide-react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

interface ConnectionStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  className = "",
  showDetails = false
}) => {
  const {
    isOnline,
    queuedOperations,
    isProcessingQueue,
    hasFailedOperations,
    forcSync,
    clearQueue,
    queueSize
  } = useOfflineQueue();

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    if (isProcessingQueue) return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (queueSize > 0) return <Upload className="h-3 w-3" />;
    return <Wifi className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (isProcessingQueue) return "Syncing...";
    if (queueSize > 0) return `${queueSize} Queued`;
    return "Online";
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!isOnline) return "destructive";
    if (hasFailedOperations) return "destructive";
    if (queueSize > 0) return "secondary";
    return "default";
  };

  if (!showDetails) {
    return (
      <Badge variant={getStatusVariant()} className={className}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Badge variant={getStatusVariant()}>
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </Badge>
        
        {queueSize > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={forcSync}
              disabled={!isOnline || isProcessingQueue}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearQueue}
              disabled={isProcessingQueue}
            >
              Clear Queue
            </Button>
          </div>
        )}
      </div>

      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Changes will be saved locally and synced when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {hasFailedOperations && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some operations failed to sync. They will be retried automatically or you can try syncing manually.
          </AlertDescription>
        </Alert>
      )}

      {queueSize > 0 && isOnline && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {queueSize} operation(s) queued for synchronization.
            {isProcessingQueue ? " Syncing in progress..." : " Click 'Sync Now' to process immediately."}
          </AlertDescription>
        </Alert>
      )}

      {queueSize === 0 && isOnline && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All operations are synchronized. Your changes are saved to the server.
          </AlertDescription>
        </Alert>
      )}

      {queuedOperations.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Queued Operations:</p>
          <ul className="space-y-1">
            {queuedOperations.slice(0, 5).map((op, index) => (
              <li key={op.id} className="flex justify-between">
                <span>{op.type.toUpperCase()}</span>
                <span>{op.retryCount > 0 ? `Retry ${op.retryCount}` : 'Pending'}</span>
              </li>
            ))}
            {queuedOperations.length > 5 && (
              <li className="text-center">...and {queuedOperations.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;