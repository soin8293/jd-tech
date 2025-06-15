import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Clock, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  Edit,
  History
} from "lucide-react";
import { useRealTimeRooms, RoomChange } from "@/hooks/useRealTimeRooms";
import { formatDistanceToNow } from "date-fns";

interface RealTimeStatusProps {
  onRoomChange?: (change: RoomChange) => void;
  onConflict?: (conflictedRoom: any, serverRoom: any) => void;
  className?: string;
}

export const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  onRoomChange,
  onConflict,
  className = ""
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const {
    isConnected,
    lastUpdate,
    activeUsers,
    pendingChanges,
    conflictCount,
    syncRooms,
    clearPendingChanges
  } = useRealTimeRooms(50, true, onRoomChange, onConflict);

  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        icon: <Wifi className="h-4 w-4 text-green-500" />,
        text: "Connected",
        variant: "default" as const,
        description: "Real-time updates active"
      };
    } else {
      return {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        text: "Disconnected",
        variant: "destructive" as const,
        description: "Real-time updates unavailable"
      };
    }
  };

  const status = getConnectionStatus();

  const formatLastUpdate = useCallback(() => {
    if (!lastUpdate) return "Never";
    return formatDistanceToNow(lastUpdate, { addSuffix: true });
  }, [lastUpdate]);

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant={status.variant} className="flex items-center gap-1">
          {status.icon}
          {status.text}
        </Badge>
        {activeUsers.length > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {activeUsers.length}
          </Badge>
        )}
        {conflictCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {conflictCount} conflicts
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(true)}
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {status.icon}
            Real-Time Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(false)}
          >
            ×
          </Button>
        </div>
        <CardDescription>{status.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Info */}
        <div className="flex items-center justify-between text-sm">
          <span>Last Update:</span>
          <span className="text-muted-foreground">{formatLastUpdate()}</span>
        </div>

        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users ({activeUsers.length})
            </h4>
            <div className="space-y-1">
              {activeUsers.slice(0, 5).map((user) => (
                <div key={user.userId} className="flex items-center justify-between text-xs">
                  <span className="truncate">{user.email}</span>
                  <div className="flex items-center gap-1">
                    {user.editingRoomId && (
                      <Badge variant="outline" className="h-5 text-xs">
                        <Edit className="h-2 w-2 mr-1" />
                        Editing
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
              {activeUsers.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{activeUsers.length - 5} more users
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conflicts */}
        {conflictCount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{conflictCount} data conflicts detected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearPendingChanges}
              >
                Resolve
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Activity */}
        {pendingChanges.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Activity
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActivityLog(!showActivityLog)}
              >
                {showActivityLog ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showActivityLog && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {pendingChanges.slice(-5).map((change, index) => (
                  <div key={index} className="text-xs border rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {change.type.toUpperCase()}: {change.room.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(change.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    {change.userEmail && (
                      <div className="text-muted-foreground">
                        by {change.userEmail}
                      </div>
                    )}
                    {change.changeDetails && change.changeDetails.length > 0 && (
                      <div className="text-muted-foreground">
                        Changes: {change.changeDetails.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncRooms}
            disabled={!isConnected}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Sync Now
          </Button>
          
          {pendingChanges.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPendingChanges}
              className="flex-1"
            >
              Clear History
            </Button>
          )}
        </div>

        {/* Status Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {isConnected ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
              {isConnected ? 'Online' : 'Offline'}
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pendingChanges.length} events
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {activeUsers.length} users
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeStatus;