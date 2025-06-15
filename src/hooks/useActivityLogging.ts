import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { Room } from "@/types/hotel.types";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export interface ActivityLog {
  id: string;
  type: 'room_created' | 'room_updated' | 'room_deleted' | 'room_locked' | 'room_unlocked' | 'admin_action';
  roomId?: string;
  roomName?: string;
  userId: string;
  userEmail: string;
  timestamp: Date;
  details: {
    action: string;
    changes?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditTrailState {
  activities: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

export const useActivityLogging = () => {
  const { currentUser } = useAuth();
  const [auditState, setAuditState] = useState<AuditTrailState>({
    activities: [],
    isLoading: false,
    error: null,
    hasMore: true
  });

  // Log an activity
  const logActivity = useCallback(async (
    type: ActivityLog['type'],
    details: ActivityLog['details'],
    roomId?: string,
    roomName?: string
  ): Promise<void> => {
    if (!currentUser) return;

    try {
      const activityData = {
        type,
        roomId,
        roomName,
        userId: currentUser.uid,
        userEmail: currentUser.email || 'Unknown',
        timestamp: serverTimestamp(),
        details,
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent,
        sessionId: getSessionId()
      };

      await addDoc(collection(db, 'activityLogs'), activityData);
      
      logger.info('Activity logged', { type, roomId, details });

    } catch (error) {
      logger.error('Failed to log activity', error);
    }
  }, [currentUser]);

  // Log room creation
  const logRoomCreated = useCallback(async (room: Room): Promise<void> => {
    await logActivity(
      'room_created',
      {
        action: 'Room created',
        newValues: {
          name: room.name,
          price: room.price,
          capacity: room.capacity,
          availability: room.availability
        }
      },
      room.id,
      room.name
    );
  }, [logActivity]);

  // Log room updates with change detection
  const logRoomUpdated = useCallback(async (
    oldRoom: Room,
    newRoom: Room,
    changes: string[]
  ): Promise<void> => {
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    changes.forEach(field => {
      oldValues[field] = (oldRoom as any)[field];
      newValues[field] = (newRoom as any)[field];
    });

    await logActivity(
      'room_updated',
      {
        action: 'Room updated',
        changes,
        oldValues,
        newValues,
        metadata: {
          changeCount: changes.length,
          significantChange: changes.includes('price') || changes.includes('availability')
        }
      },
      newRoom.id,
      newRoom.name
    );
  }, [logActivity]);

  // Log room deletion
  const logRoomDeleted = useCallback(async (room: Room): Promise<void> => {
    await logActivity(
      'room_deleted',
      {
        action: 'Room deleted',
        oldValues: {
          name: room.name,
          price: room.price,
          capacity: room.capacity
        },
        metadata: {
          deletionReason: 'User action',
          hadActiveBookings: room.bookings && room.bookings.length > 0
        }
      },
      room.id,
      room.name
    );
  }, [logActivity]);

  // Log room locking/unlocking
  const logRoomLocked = useCallback(async (
    roomId: string,
    roomName: string,
    lockDuration: number
  ): Promise<void> => {
    await logActivity(
      'room_locked',
      {
        action: 'Room locked for editing',
        metadata: {
          lockDuration,
          lockExpiry: new Date(Date.now() + lockDuration * 60 * 1000)
        }
      },
      roomId,
      roomName
    );
  }, [logActivity]);

  const logRoomUnlocked = useCallback(async (
    roomId: string,
    roomName: string,
    lockDuration: number
  ): Promise<void> => {
    await logActivity(
      'room_unlocked',
      {
        action: 'Room lock released',
        metadata: {
          actualLockDuration: lockDuration,
          wasAutoRelease: false
        }
      },
      roomId,
      roomName
    );
  }, [logActivity]);

  // Log admin actions
  const logAdminAction = useCallback(async (
    action: string,
    details: Record<string, any> = {}
  ): Promise<void> => {
    await logActivity(
      'admin_action',
      {
        action,
        metadata: {
          ...details,
          adminLevel: 'admin', // Could be enhanced with role detection
          timestamp: new Date()
        }
      }
    );
  }, [logActivity]);

  // Load activity logs
  const loadActivities = useCallback(async (
    limitCount: number = 50,
    roomFilter?: string
  ): Promise<(() => void) | undefined> => {
    setAuditState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let q = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (roomFilter) {
        q = query(
          collection(db, 'activityLogs'),
          where('roomId', '==', roomFilter),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const activities: ActivityLog[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp 
              ? data.timestamp.toDate() 
              : new Date(data.timestamp)
          } as ActivityLog;
        });

        setAuditState(prev => ({
          ...prev,
          activities,
          isLoading: false,
          hasMore: activities.length === limitCount
        }));
      });

      return () => unsubscribe();

    } catch (error: any) {
      logger.error('Failed to load activities', error);
      setAuditState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      return undefined;
    }
  }, []);

  // Get activities for specific room
  const getRoomActivities = useCallback(async (roomId: string): Promise<ActivityLog[]> => {
    try {
      const q = query(
        collection(db, 'activityLogs'),
        where('roomId', '==', roomId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const activities: ActivityLog[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp instanceof Timestamp 
                ? data.timestamp.toDate() 
                : new Date(data.timestamp)
            } as ActivityLog;
          });
          
          resolve(activities);
          unsubscribe();
        });
      });

    } catch (error) {
      logger.error('Failed to get room activities', error);
      return [];
    }
  }, []);

  // Get activity statistics
  const getActivityStats = useCallback(async (): Promise<{
    totalActivities: number;
    todayActivities: number;
    topUsers: Array<{ email: string; count: number }>;
    activityTypes: Array<{ type: string; count: number }>;
  }> => {
    try {
      // This would typically be done server-side for performance
      // For now, we'll use the loaded activities
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayActivities = auditState.activities.filter(
        activity => activity.timestamp >= today
      );

      const userCounts = auditState.activities.reduce((acc, activity) => {
        acc[activity.userEmail] = (acc[activity.userEmail] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const typeCounts = auditState.activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalActivities: auditState.activities.length,
        todayActivities: todayActivities.length,
        topUsers: Object.entries(userCounts)
          .map(([email, count]) => ({ email, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        activityTypes: Object.entries(typeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
      };

    } catch (error) {
      logger.error('Failed to get activity stats', error);
      return {
        totalActivities: 0,
        todayActivities: 0,
        topUsers: [],
        activityTypes: []
      };
    }
  }, [auditState.activities]);

  // Auto-load activities on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    loadActivities().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadActivities]);

  return {
    auditState,
    logRoomCreated,
    logRoomUpdated,
    logRoomDeleted,
    logRoomLocked,
    logRoomUnlocked,
    logAdminAction,
    loadActivities,
    getRoomActivities,
    getActivityStats,
    activities: auditState.activities,
    isLoading: auditState.isLoading,
    error: auditState.error
  };
};

// Utility functions
async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}