import { useState, useCallback, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Room } from "@/types/hotel.types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface ConflictState {
  conflictDetected: boolean;
  lastKnownVersion?: number;
  serverVersion?: number;
  conflictReason?: string;
}

export const useConflictDetection = (roomId: string | null, initialVersion?: number) => {
  const { currentUser } = useAuth();
  const [conflictState, setConflictState] = useState<ConflictState>({
    conflictDetected: false,
    lastKnownVersion: initialVersion
  });

  // Monitor room for version changes
  const startConflictMonitoring = useCallback(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = doc.data() as Room;
        const serverVersion = roomData.version || 0;
        
        // Check for version conflicts
        if (conflictState.lastKnownVersion !== undefined && 
            serverVersion > conflictState.lastKnownVersion) {
          
          setConflictState(prev => ({
            ...prev,
            conflictDetected: true,
            serverVersion,
            conflictReason: 'Version mismatch detected'
          }));

          toast({
            title: "Conflict Detected",
            description: "This room has been updated by another user. Your changes may conflict.",
            variant: "destructive",
          });

          logger.warn('Version conflict detected', {
            roomId,
            clientVersion: conflictState.lastKnownVersion,
            serverVersion
          });
        }
      }
    });

    return unsubscribe;
  }, [roomId, conflictState.lastKnownVersion]);

  // Update the known version (call this after successful saves)
  const updateKnownVersion = useCallback((newVersion: number) => {
    setConflictState(prev => ({
      ...prev,
      lastKnownVersion: newVersion,
      conflictDetected: false,
      conflictReason: undefined
    }));
  }, []);

  // Clear conflict state
  const clearConflict = useCallback(() => {
    setConflictState(prev => ({
      ...prev,
      conflictDetected: false,
      conflictReason: undefined
    }));
  }, []);

  // Check if save is safe (no conflicts)
  const isSaveSafe = useCallback((): boolean => {
    return !conflictState.conflictDetected;
  }, [conflictState.conflictDetected]);

  // Resolve conflict by accepting server version
  const resolveConflict = useCallback(async (): Promise<Room | null> => {
    if (!roomId || !conflictState.conflictDetected) return null;

    try {
      const { getDoc } = await import("firebase/firestore");
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const serverRoom = roomDoc.data() as Room;
        
        // Update our known version to match server
        setConflictState(prev => ({
          ...prev,
          lastKnownVersion: serverRoom.version,
          conflictDetected: false,
          conflictReason: undefined
        }));

        toast({
          title: "Conflict Resolved",
          description: "Room data has been updated to match the server version.",
        });

        logger.info('Conflict resolved by accepting server version', {
          roomId,
          newVersion: serverRoom.version
        });

        return serverRoom;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to resolve conflict', error);
      toast({
        title: "Resolution Failed",
        description: "Could not resolve the conflict. Please refresh the page.",
        variant: "destructive",
      });
      return null;
    }
  }, [roomId, conflictState.conflictDetected]);

  // Start monitoring when roomId changes
  useEffect(() => {
    if (roomId) {
      const unsubscribe = startConflictMonitoring();
      return unsubscribe;
    }
  }, [roomId, startConflictMonitoring]);

  return {
    conflictState,
    updateKnownVersion,
    clearConflict,
    isSaveSafe,
    resolveConflict,
    conflictDetected: conflictState.conflictDetected,
    conflictReason: conflictState.conflictReason
  };
};