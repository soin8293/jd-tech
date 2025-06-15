import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lock, 
  Unlock, 
  Edit, 
  User, 
  Clock, 
  AlertTriangle,
  Save,
  Shield
} from "lucide-react";
import { useCollaborativeEditing } from "@/hooks/useCollaborativeEditing";
import { formatDistanceToNow } from "date-fns";

interface CollaborativeEditingGuardProps {
  roomId: string;
  roomName: string;
  onLockAcquired?: () => void;
  onLockReleased?: () => void;
  onConflictDetected?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const CollaborativeEditingGuard: React.FC<CollaborativeEditingGuardProps> = ({
  roomId,
  roomName,
  onLockAcquired,
  onLockReleased,
  onConflictDetected,
  children,
  className = ""
}) => {
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockDuration, setLockDuration] = useState(15);

  const {
    editingState,
    lockRoom,
    unlockRoom,
    toggleAutoSave,
    forceTakeover,
    canEdit,
    isLocked,
    lockedBy,
    lockedAt,
    autoSaveEnabled,
    conflictDetected
  } = useCollaborativeEditing(roomId);

  const handleLockRoom = async () => {
    const success = await lockRoom(lockDuration);
    if (success) {
      onLockAcquired?.();
      setShowLockDialog(false);
    }
  };

  const handleUnlockRoom = async () => {
    await unlockRoom();
    onLockReleased?.();
  };

  const handleForceTakeover = async () => {
    const success = await forceTakeover();
    if (success) {
      onLockAcquired?.();
    }
  };

  // Handle conflict detection
  React.useEffect(() => {
    if (conflictDetected) {
      onConflictDetected?.();
    }
  }, [conflictDetected, onConflictDetected]);

  const getLockStatus = () => {
    if (!isLocked) {
      return {
        icon: <Unlock className="h-4 w-4 text-green-500" />,
        text: "Available",
        variant: "default" as const,
        description: "Room is available for editing"
      };
    } else if (canEdit()) {
      return {
        icon: <Lock className="h-4 w-4 text-blue-500" />,
        text: "Locked by You",
        variant: "default" as const,
        description: `Auto-save is ${autoSaveEnabled ? 'enabled' : 'disabled'}`
      };
    } else {
      return {
        icon: <Lock className="h-4 w-4 text-red-500" />,
        text: "Locked by Another User",
        variant: "destructive" as const,
        description: `Locked by ${lockedBy}`
      };
    }
  };

  const status = getLockStatus();

  return (
    <div className={className}>
      {/* Lock Status Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {status.icon}
              Editing Status: {roomName}
            </CardTitle>
            <Badge variant={status.variant}>
              {status.text}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{status.description}</p>
          
          {/* Lock Details */}
          {isLocked && lockedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Locked {formatDistanceToNow(lockedAt, { addSuffix: true })}
            </div>
          )}

          {/* Conflict Alert */}
          {conflictDetected && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Conflict detected! Your changes may conflict with recent updates. 
                Save immediately or consider refreshing the page.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!isLocked && (
              <Button
                size="sm"
                onClick={() => setShowLockDialog(true)}
                className="flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                Start Editing
              </Button>
            )}
            
            {isLocked && canEdit() && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUnlockRoom}
                  className="flex items-center gap-1"
                >
                  <Unlock className="h-3 w-3" />
                  Release Lock
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleAutoSave}
                  className="flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
                </Button>
              </>
            )}
            
            {isLocked && !canEdit() && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleForceTakeover}
                className="flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                Force Takeover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lock Duration Dialog */}
      {showLockDialog && (
        <Card className="mb-4 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Start Editing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Lock Duration (minutes)</label>
              <select
                value={lockDuration}
                onChange={(e) => setLockDuration(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded text-sm"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" onClick={handleLockRoom} className="flex-1">
                <Lock className="h-3 w-3 mr-1" />
                Lock & Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowLockDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Only editable if user can edit */}
      <div className={!canEdit() ? "pointer-events-none opacity-50" : ""}>
        {children}
      </div>

      {/* Editing Disabled Overlay */}
      {!canEdit() && isLocked && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Room Being Edited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This room is currently being edited by {lockedBy}. 
                You can view the content but cannot make changes.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleForceTakeover}
                  variant="destructive"
                  className="flex-1"
                >
                  Force Takeover
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditingGuard;