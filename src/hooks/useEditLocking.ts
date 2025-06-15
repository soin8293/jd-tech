import { useState, useCallback, useRef, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  where,
  DocumentReference
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface EditLock {
  roomId: string;
  userId: string;
  userEmail: string;
  lockedAt: Date;
  expiresAt: Date;
}

export interface EditLockState {
  isLocked: boolean;
  lockedBy?: string;
  lockedByEmail?: string;
  lockedAt?: Date;
  lockDuration: number;
}

export const useEditLocking = (roomId: string | null) => {
  const { currentUser } = useAuth();
  const [lockState, setLockState] = useState<EditLockState>({
    isLocked: false,
    lockDuration: 15
  });

  const lockRef = useRef<DocumentReference | null>(null);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Lock a room for editing
  const lockRoom = useCallback(async (duration: number = 15): Promise<boolean> => {
    if (!roomId || !currentUser) return false;

    try {
      const lockDocRef = doc(db, 'editLocks', roomId);
      lockRef.current = lockDocRef;

      const expireAt = new Date(Date.now() + duration * 60 * 1000);
      const lockData = {
        roomId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        lockedAt: serverTimestamp(),
        expiresAt: expireAt,
        expireAt, // TTL field for automatic cleanup
        isActive: true
      };

      await updateDoc(lockDocRef, lockData);

      setLockState(prev => ({
        ...prev,
        isLocked: true,
        lockedBy: currentUser.uid,
        lockedByEmail: currentUser.email,
        lockedAt: new Date(),
        lockDuration: duration
      }));

      // Set up lock renewal
      lockTimeoutRef.current = setTimeout(() => {
        renewLock();
      }, (duration - 2) * 60 * 1000); // Renew 2 minutes before expiry

      logger.info('Room locked for editing', { roomId, duration });
      return true;

    } catch (error) {
      logger.error('Failed to lock room', error);
      toast({
        title: "Lock Failed",
        description: "Could not lock room for editing. Another user may be editing.",
        variant: "destructive",
      });
      return false;
    }
  }, [roomId, currentUser]);

  // Release room lock
  const unlockRoom = useCallback(async (): Promise<void> => {
    if (!roomId || !currentUser || !lockRef.current) return;

    try {
      await updateDoc(lockRef.current, {
        isActive: false,
        releasedAt: serverTimestamp(),
        releasedBy: currentUser.uid
      });

      setLockState(prev => ({
        ...prev,
        isLocked: false,
        lockedBy: undefined,
        lockedByEmail: undefined,
        lockedAt: undefined
      }));

      // Clear timers
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = null;
      }

      logger.info('Room lock released', { roomId });

    } catch (error) {
      logger.error('Failed to release room lock', error);
    }
  }, [roomId, currentUser]);

  // Renew existing lock
  const renewLock = useCallback(async (): Promise<void> => {
    if (!lockRef.current || !currentUser) return;

    try {
      const newExpiryTime = new Date(Date.now() + lockState.lockDuration * 60 * 1000);
      
      await updateDoc(lockRef.current, {
        expiresAt: newExpiryTime,
        renewedAt: serverTimestamp()
      });

      // Set up next renewal
      lockTimeoutRef.current = setTimeout(() => {
        renewLock();
      }, (lockState.lockDuration - 2) * 60 * 1000);

      logger.info('Room lock renewed', { roomId, newExpiryTime });

    } catch (error) {
      logger.error('Failed to renew room lock', error);
      
      // If renewal fails, consider lock lost
      setLockState(prev => ({
        ...prev,
        isLocked: false
      }));

      toast({
        title: "Lock Lost",
        description: "Your editing lock has expired. Save your changes immediately.",
        variant: "destructive",
      });
    }
  }, [roomId, lockState.lockDuration]);

  // Check if room is locked by another user using server-side query
  const checkLockStatus = useCallback(async (): Promise<EditLock | null> => {
    if (!roomId) return null;

    try {
      // Use server-side query for efficiency
      const locksQuery = query(
        collection(db, 'editLocks'),
        where('roomId', '==', roomId),
        where('isActive', '==', true)
      );
      
      // Set up real-time listener for lock status
      const unsubscribe = onSnapshot(locksQuery, (snapshot) => {
        if (!snapshot.empty) {
          const lockDoc = snapshot.docs[0]; // Should only be one active lock
          const lockData = lockDoc.data();
          const isActive = lockData.isActive;
          const expiresAt = lockData.expiresAt?.toDate();
          const isExpired = expiresAt && expiresAt < new Date();
          const isOwnLock = lockData.userId === currentUser?.uid;

          if (isActive && !isExpired && !isOwnLock) {
            // Room is locked by another user
            setLockState(prev => ({
              ...prev,
              isLocked: true,
              lockedBy: lockData.userId,
              lockedByEmail: lockData.userEmail,
              lockedAt: lockData.lockedAt?.toDate()
            }));

            toast({
              title: "Room Locked",
              description: `This room is being edited by ${lockData.userEmail}`,
              variant: "destructive",
            });
          } else if (isOwnLock && isActive && !isExpired) {
            // Current user has the lock
            setLockState(prev => ({
              ...prev,
              isLocked: true,
              lockedBy: currentUser?.uid,
              lockedByEmail: currentUser?.email,
              lockedAt: lockData.lockedAt?.toDate()
            }));
          } else {
            // No active lock or lock expired
            setLockState(prev => ({
              ...prev,
              isLocked: false,
              lockedBy: undefined,
              lockedByEmail: undefined,
              lockedAt: undefined
            }));
          }
        } else {
          // No locks found
          setLockState(prev => ({
            ...prev,
            isLocked: false,
            lockedBy: undefined,
            lockedByEmail: undefined,
            lockedAt: undefined
          }));
        }
      });

      unsubscribeRef.current = unsubscribe;
      return null;

    } catch (error) {
      logger.error('Failed to check lock status', error);
      return null;
    }
  }, [roomId, currentUser]);

  // Force takeover of lock (admin only)
  const forceTakeover = useCallback(async (): Promise<boolean> => {
    if (!roomId || !currentUser) return false;

    try {
      const lockDocRef = doc(db, 'editLocks', roomId);
      
      await updateDoc(lockDocRef, {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        lockedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + lockState.lockDuration * 60 * 1000),
        isActive: true,
        takenOver: true,
        previousUser: lockState.lockedBy
      });

      setLockState(prev => ({
        ...prev,
        isLocked: true,
        lockedBy: currentUser.uid,
        lockedByEmail: currentUser.email,
        lockedAt: new Date()
      }));

      toast({
        title: "Lock Taken Over",
        description: "You have taken over editing rights for this room",
      });

      return true;

    } catch (error) {
      logger.error('Failed to take over lock', error);
      toast({
        title: "Takeover Failed",
        description: "Could not take over editing rights",
        variant: "destructive",
      });
      return false;
    }
  }, [roomId, currentUser, lockState.lockDuration, lockState.lockedBy]);

  // Check if current user can edit
  const canEdit = useCallback((): boolean => {
    if (!lockState.isLocked) return true;
    return lockState.lockedBy === currentUser?.uid;
  }, [lockState.isLocked, lockState.lockedBy, currentUser?.uid]);

  // Initialize lock checking when roomId changes
  useEffect(() => {
    if (roomId) {
      checkLockStatus();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [roomId, checkLockStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unlockRoom();
      
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [unlockRoom]);

  return {
    lockState,
    lockRoom,
    unlockRoom,
    renewLock,
    checkLockStatus,
    forceTakeover,
    canEdit,
    isLocked: lockState.isLocked,
    lockedBy: lockState.lockedByEmail,
    lockedAt: lockState.lockedAt
  };
};