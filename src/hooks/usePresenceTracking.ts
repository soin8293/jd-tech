import { useState, useEffect, useCallback } from "react";
import { getDatabase, ref, set, onDisconnect, onValue, serverTimestamp } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export interface UserPresence {
  userId: string;
  email: string;
  isOnline: boolean;
  lastSeen: number;
  editingRoomId?: string;
}

export const usePresenceTracking = () => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Set user as online and setup disconnect handling
  const setUserOnline = useCallback(async () => {
    if (!currentUser) return;

    try {
      const rtdb = getDatabase();
      const userStatusRef = ref(rtdb, `/presence/${currentUser.uid}`);
      
      // Set user as online
      await set(userStatusRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        isOnline: true,
        lastSeen: serverTimestamp()
      });

      // Setup disconnect handler - this runs on Google's servers
      await onDisconnect(userStatusRef).update({
        isOnline: false,
        lastSeen: serverTimestamp()
      });

      setIsConnected(true);
      logger.info('User presence set to online', { userId: currentUser.uid });

    } catch (error) {
      logger.error('Failed to set user presence', error);
      setIsConnected(false);
    }
  }, [currentUser]);

  // Update editing status
  const setEditingRoom = useCallback(async (roomId: string | null) => {
    if (!currentUser || !isConnected) return;

    try {
      const rtdb = getDatabase();
      const userStatusRef = ref(rtdb, `/presence/${currentUser.uid}`);
      
      await set(userStatusRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        isOnline: true,
        lastSeen: serverTimestamp(),
        editingRoomId: roomId
      });

      logger.info('User editing status updated', { userId: currentUser.uid, roomId });

    } catch (error) {
      logger.error('Failed to update editing status', error);
    }
  }, [currentUser, isConnected]);

  // Set user as offline
  const setUserOffline = useCallback(async () => {
    if (!currentUser) return;

    try {
      const rtdb = getDatabase();
      const userStatusRef = ref(rtdb, `/presence/${currentUser.uid}`);
      
      await set(userStatusRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        isOnline: false,
        lastSeen: serverTimestamp()
      });

      setIsConnected(false);
      logger.info('User presence set to offline', { userId: currentUser.uid });

    } catch (error) {
      logger.error('Failed to set user offline', error);
    }
  }, [currentUser]);

  // Listen to all user presence
  useEffect(() => {
    if (!currentUser) return;

    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, '/presence');

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val();
      if (presenceData) {
        const users: UserPresence[] = Object.values(presenceData)
          .filter((user: any) => user.userId !== currentUser.uid) // Exclude current user
          .map((user: any) => ({
            userId: user.userId,
            email: user.email,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            editingRoomId: user.editingRoomId
          }));

        setOnlineUsers(users);
      } else {
        setOnlineUsers([]);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  // Setup presence on mount
  useEffect(() => {
    if (currentUser) {
      setUserOnline();
    }

    // Cleanup on unmount
    return () => {
      if (currentUser) {
        setUserOffline();
      }
    };
  }, [currentUser, setUserOnline, setUserOffline]);

  // Get users editing a specific room
  const getUsersEditingRoom = useCallback((roomId: string): UserPresence[] => {
    return onlineUsers.filter(user => 
      user.isOnline && user.editingRoomId === roomId
    );
  }, [onlineUsers]);

  return {
    onlineUsers,
    isConnected,
    setEditingRoom,
    getUsersEditingRoom,
    currentUserCount: onlineUsers.filter(u => u.isOnline).length
  };
};