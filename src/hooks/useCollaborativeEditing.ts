import { useEditLocking } from "./useEditLocking";
import { useAutoSave } from "./useAutoSave";
import { useConflictDetection } from "./useConflictDetection";

// Re-export types for backward compatibility
export type { EditLock } from "./useEditLocking";

export interface CollaborativeEditingState {
  isLocked: boolean;
  lockedBy?: string;
  lockedByEmail?: string;
  lockedAt?: Date;
  lockDuration: number;
  autoSaveEnabled: boolean;
  conflictDetected: boolean;
}

export const useCollaborativeEditing = (roomId: string | null) => {
  const {
    lockState,
    lockRoom,
    unlockRoom,
    renewLock,
    checkLockStatus,
    forceTakeover,
    canEdit,
    isLocked,
    lockedBy,
    lockedAt
  } = useEditLocking(roomId);

  const {
    autoSaveState,
    setupAutoSave,
    toggleAutoSave,
    autoSaveEnabled
  } = useAutoSave(roomId, isLocked, canEdit());

  const {
    conflictState,
    updateKnownVersion,
    clearConflict,
    isSaveSafe,
    resolveConflict,
    conflictDetected
  } = useConflictDetection(roomId);

  // Combine states for backward compatibility
  const editingState: CollaborativeEditingState = {
    isLocked,
    lockedBy: lockState.lockedByEmail,
    lockedByEmail: lockState.lockedByEmail,
    lockedAt,
    lockDuration: lockState.lockDuration,
    autoSaveEnabled,
    conflictDetected
  };

  return {
    editingState,
    lockRoom,
    unlockRoom,
    renewLock,
    checkLockStatus,
    setupAutoSave,
    toggleAutoSave,
    forceTakeover,
    canEdit,
    isLocked,
    lockedBy,
    lockedAt,
    autoSaveEnabled,
    conflictDetected,
    // Additional methods from new hooks
    updateKnownVersion,
    clearConflict,
    isSaveSafe,
    resolveConflict
  };
};