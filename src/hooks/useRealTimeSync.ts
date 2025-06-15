import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit
} from "firebase/firestore";
import { Room } from "@/types/hotel.types";
import { logger } from "@/utils/logger";

export interface RealTimeSyncState {
  rooms: Room[];
  isConnected: boolean;
  lastSyncTime?: Date;
  error: string | null;
}

export const useRealTimeSync = (maxRooms: number = 50) => {
  const [syncState, setSyncState] = useState<RealTimeSyncState>({
    rooms: [],
    isConnected: false,
    error: null
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Start real-time sync
  const startSync = useCallback(() => {
    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        orderBy('updatedAt', 'desc'),
        limit(maxRooms)
      );

      const unsubscribe = onSnapshot(
        roomsQuery,
        (snapshot) => {
          const rooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Room[];

          setSyncState(prev => ({
            ...prev,
            rooms,
            isConnected: true,
            lastSyncTime: new Date(),
            error: null
          }));

          logger.info('Real-time rooms synced', { count: rooms.length });
        },
        (error) => {
          logger.error('Real-time sync error', error);
          setSyncState(prev => ({
            ...prev,
            isConnected: false,
            error: error.message || 'Sync connection failed'
          }));
        }
      );

      unsubscribeRef.current = unsubscribe;
      
      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        error: null
      }));

    } catch (error: any) {
      logger.error('Failed to start real-time sync', error);
      setSyncState(prev => ({
        ...prev,
        isConnected: false,
        error: error.message || 'Failed to connect'
      }));
    }
  }, [maxRooms]);

  // Stop real-time sync
  const stopSync = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setSyncState(prev => ({
      ...prev,
      isConnected: false
    }));

    logger.info('Real-time sync stopped');
  }, []);

  // Auto-start sync on mount
  useEffect(() => {
    startSync();

    return () => {
      stopSync();
    };
  }, [startSync, stopSync]);

  return {
    syncState,
    startSync,
    stopSync,
    rooms: syncState.rooms,
    isConnected: syncState.isConnected,
    lastSyncTime: syncState.lastSyncTime,
    error: syncState.error
  };
};