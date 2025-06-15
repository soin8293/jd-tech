import { useState, useEffect, useCallback } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export interface RealTimeUserPresence {
  userId: string;
  email: string;
  isOnline: boolean;
  lastSeen: number;
  editingRoomId?: string;
  sessionId?: string;
}

export interface PresenceState {
  onlineUsers: RealTimeUserPresence[];
  isConnected: boolean;
  currentUserCount: number;
}

export const useRealTimePresence = () => {
  const { currentUser } = useAuth();
  const [presenceState, setPresenceState] = useState<PresenceState>({
    onlineUsers: [],
    isConnected: false,
    currentUserCount: 0
  });

  // Start listening to presence
  const startPresenceTracking = useCallback(() => {
    if (!currentUser) return;

    try {
      const rtdb = getDatabase();
      const presenceRef = ref(rtdb, '/presence');

      const handlePresenceUpdate = (snapshot: any) => {
        const presenceData = snapshot.val();
        
        if (presenceData) {
          const users: RealTimeUserPresence[] = Object.values(presenceData)
            .filter((user: any) => user.userId !== currentUser.uid) // Exclude current user
            .map((user: any) => ({
              userId: user.userId,
              email: user.email,
              isOnline: user.isOnline,
              lastSeen: user.lastSeen,
              editingRoomId: user.editingRoomId,
              sessionId: user.sessionId
            }));

          const onlineCount = users.filter(u => u.isOnline).length;

          setPresenceState({
            onlineUsers: users,
            isConnected: true,
            currentUserCount: onlineCount
          });

          logger.info('Presence updated', { 
            totalUsers: users.length,
            onlineUsers: onlineCount
          });
        } else {
          setPresenceState({
            onlineUsers: [],
            isConnected: true,
            currentUserCount: 0
          });
        }
      };

      onValue(presenceRef, handlePresenceUpdate, (error) => {
        logger.error('Presence tracking error', error);
        setPresenceState(prev => ({
          ...prev,
          isConnected: false
        }));
      });

      setPresenceState(prev => ({
        ...prev,
        isConnected: true
      }));

      // Return cleanup function
      return () => {
        off(presenceRef, 'value', handlePresenceUpdate);
      };

    } catch (error) {
      logger.error('Failed to start presence tracking', error);
      setPresenceState(prev => ({
        ...prev,
        isConnected: false
      }));
    }
  }, [currentUser]);

  // Stop presence tracking
  const stopPresenceTracking = useCallback(() => {
    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, '/presence');
    off(presenceRef);
    
    setPresenceState({
      onlineUsers: [],
      isConnected: false,
      currentUserCount: 0
    });
    
    logger.info('Presence tracking stopped');
  }, []);

  // Get users editing a specific room
  const getUsersEditingRoom = useCallback((roomId: string): RealTimeUserPresence[] => {
    return presenceState.onlineUsers.filter(user => 
      user.isOnline && user.editingRoomId === roomId
    );
  }, [presenceState.onlineUsers]);

  // Get user by ID
  const getUserPresence = useCallback((userId: string): RealTimeUserPresence | undefined => {
    return presenceState.onlineUsers.find(user => user.userId === userId);
  }, [presenceState.onlineUsers]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    const user = getUserPresence(userId);
    return user?.isOnline || false;
  }, [getUserPresence]);

  // Auto-start presence tracking
  useEffect(() => {
    const cleanup = startPresenceTracking();
    
    return () => {
      if (cleanup) cleanup();
      stopPresenceTracking();
    };
  }, [startPresenceTracking, stopPresenceTracking]);

  return {
    presenceState,
    startPresenceTracking,
    stopPresenceTracking,
    getUsersEditingRoom,
    getUserPresence,
    isUserOnline,
    onlineUsers: presenceState.onlineUsers,
    isConnected: presenceState.isConnected,
    currentUserCount: presenceState.currentUserCount
  };
};