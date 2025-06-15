import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export interface AutoSaveState {
  autoSaveEnabled: boolean;
  lastSaveTime?: Date;
  isSaving: boolean;
}

export const useAutoSave = (roomId: string | null, isLocked: boolean, lockedByCurrentUser: boolean) => {
  const { currentUser } = useAuth();
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    autoSaveEnabled: true,
    isSaving: false
  });

  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup auto-save functionality
  const setupAutoSave = useCallback((saveFunction: () => Promise<void>) => {
    if (!autoSaveState.autoSaveEnabled) return;

    // Clear existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Setup new auto-save interval (every 2 minutes)
    autoSaveIntervalRef.current = setInterval(async () => {
      if (isLocked && lockedByCurrentUser) {
        try {
          setAutoSaveState(prev => ({ ...prev, isSaving: true }));
          await saveFunction();
          setAutoSaveState(prev => ({ 
            ...prev, 
            isSaving: false,
            lastSaveTime: new Date()
          }));
          logger.info('Auto-save completed', { roomId });
        } catch (error) {
          logger.error('Auto-save failed', error);
          setAutoSaveState(prev => ({ ...prev, isSaving: false }));
        }
      }
    }, 2 * 60 * 1000);
  }, [autoSaveState.autoSaveEnabled, isLocked, lockedByCurrentUser, currentUser?.uid, roomId]);

  // Toggle auto-save
  const toggleAutoSave = useCallback(() => {
    setAutoSaveState(prev => ({
      ...prev,
      autoSaveEnabled: !prev.autoSaveEnabled
    }));
    
    // Clear interval if disabling auto-save
    if (autoSaveState.autoSaveEnabled && autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
  }, [autoSaveState.autoSaveEnabled]);

  // Manual save function
  const triggerSave = useCallback(async (saveFunction: () => Promise<void>) => {
    if (!lockedByCurrentUser) return;

    try {
      setAutoSaveState(prev => ({ ...prev, isSaving: true }));
      await saveFunction();
      setAutoSaveState(prev => ({ 
        ...prev, 
        isSaving: false,
        lastSaveTime: new Date()
      }));
      logger.info('Manual save completed', { roomId });
    } catch (error) {
      logger.error('Manual save failed', error);
      setAutoSaveState(prev => ({ ...prev, isSaving: false }));
      throw error;
    }
  }, [lockedByCurrentUser, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // Clear interval when auto-save is disabled
  useEffect(() => {
    if (!autoSaveState.autoSaveEnabled && autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
  }, [autoSaveState.autoSaveEnabled]);

  return {
    autoSaveState,
    setupAutoSave,
    toggleAutoSave,
    triggerSave,
    autoSaveEnabled: autoSaveState.autoSaveEnabled,
    isSaving: autoSaveState.isSaving,
    lastSaveTime: autoSaveState.lastSaveTime
  };
};