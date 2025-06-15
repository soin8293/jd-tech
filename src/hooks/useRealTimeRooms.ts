import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  DocumentChange,
  QuerySnapshot,
  DocumentData
} from "firebase/firestore";
import { Room } from "@/types/hotel.types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface RoomChange {
  type: 'added' | 'modified' | 'removed';
  room: Room;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  changeDetails?: string[];
}

export interface RealTimeState {
  isConnected: boolean;
  lastUpdate: Date | null;
  activeUsers: Array<{
    userId: string;
    email: string;
    lastSeen: Date;
    editingRoomId?: string;
  }>;
  pendingChanges: RoomChange[];
  conflictCount: number;
}

export const useRealTimeRooms = (
  onRoomChange?: (change: RoomChange) => void,
  onConflict?: (conflictedRoom: Room, serverRoom: Room) => void
) => {
  const { currentUser } = useAuth();
  const [realTimeState, setRealTimeState] = useState<RealTimeState>({
    isConnected: false,
    lastUpdate: null,
    activeUsers: [],
    pendingChanges: [],
    conflictCount: 0
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const presenceRef = useRef<(() => void) | null>(null);
  const lastKnownRooms = useRef<Map<string, Room>>(new Map());

  // Deep comparison utility for detecting specific changes
  const detectChanges = useCallback((oldRoom: Room, newRoom: Room): string[] => {
    const changes: string[] = [];
    
    if (oldRoom.name !== newRoom.name) changes.push('name');
    if (oldRoom.description !== newRoom.description) changes.push('description');
    if (oldRoom.price !== newRoom.price) changes.push('price');
    if (oldRoom.capacity !== newRoom.capacity) changes.push('capacity');
    if (oldRoom.size !== newRoom.size) changes.push('size');
    if (oldRoom.bed !== newRoom.bed) changes.push('bed');
    if (oldRoom.availability !== newRoom.availability) changes.push('availability');
    
    // Compare arrays
    if (JSON.stringify(oldRoom.amenities) !== JSON.stringify(newRoom.amenities)) {
      changes.push('amenities');
    }
    if (JSON.stringify(oldRoom.images) !== JSON.stringify(newRoom.images)) {
      changes.push('images');
    }
    if (JSON.stringify(oldRoom.bookings) !== JSON.stringify(newRoom.bookings)) {
      changes.push('bookings');
    }
    
    return changes;
  }, []);

  // Handle real-time room changes
  const handleRoomChanges = useCallback((snapshot: QuerySnapshot<DocumentData>) => {
    const changes: RoomChange[] = [];
    
    snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
      const roomData = { id: change.doc.id, ...change.doc.data() } as Room;
      const timestamp = new Date();
      
      let changeDetails: string[] = [];
      
      if (change.type === 'modified') {
        const oldRoom = lastKnownRooms.current.get(roomData.id);
        if (oldRoom) {
          changeDetails = detectChanges(oldRoom, roomData);
          
          // Check for conflicts with local pending changes
          if (changeDetails.length > 0 && onConflict) {
            const hasLocalChanges = realTimeState.pendingChanges.some(
              c => c.room.id === roomData.id && c.type === 'modified'
            );
            
            if (hasLocalChanges) {
              onConflict(oldRoom, roomData);
              setRealTimeState(prev => ({
                ...prev,
                conflictCount: prev.conflictCount + 1
              }));
            }
          }
        }
      }
      
      const roomChange: RoomChange = {
        type: change.type,
        room: roomData,
        timestamp,
        userId: roomData.updatedBy || 'unknown',
        userEmail: roomData.updatedByEmail || 'Unknown User',
        changeDetails
      };
      
      changes.push(roomChange);
      
      // Update local rooms state
      setRooms(prevRooms => {
        let newRooms = [...prevRooms];
        
        switch (change.type) {
          case 'added':
            if (!newRooms.find(r => r.id === roomData.id)) {
              newRooms.push(roomData);
            }
            break;
            
          case 'modified':
            const index = newRooms.findIndex(r => r.id === roomData.id);
            if (index !== -1) {
              newRooms[index] = roomData;
            } else {
              newRooms.push(roomData);
            }
            break;
            
          case 'removed':
            newRooms = newRooms.filter(r => r.id !== roomData.id);
            break;
        }
        
        // Update last known rooms for conflict detection
        if (change.type === 'removed') {
          lastKnownRooms.current.delete(roomData.id);
        } else {
          lastKnownRooms.current.set(roomData.id, roomData);
        }
        
        return newRooms;
      });
      
      // Notify about room change
      if (onRoomChange) {
        onRoomChange(roomChange);
      }
      
      // Show toast notification for significant changes
      if (change.type === 'modified' && changeDetails.length > 0) {
        const isOwnChange = roomData.updatedBy === currentUser?.uid;
        
        if (!isOwnChange) {
          toast({
            title: "Room Updated",
            description: `"${roomData.name}" was updated by ${roomData.updatedByEmail || 'another user'}. Changes: ${changeDetails.join(', ')}`,
          });
        }
      }
    });
    
    // Update real-time state
    setRealTimeState(prev => ({
      ...prev,
      lastUpdate: new Date(),
      pendingChanges: [...prev.pendingChanges, ...changes].slice(-100) // Keep last 100 changes
    }));
    
    logger.info('Real-time room changes processed', {
      changeCount: changes.length,
      timestamp: new Date()
    });
  }, [detectChanges, onRoomChange, onConflict, currentUser?.uid, realTimeState.pendingChanges]);

  // Set up user presence tracking
  const setupPresenceTracking = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const presenceRef = doc(db, 'presence', currentUser.uid);
      
      // Update presence every 30 seconds
      const updatePresence = async () => {
        await updateDoc(presenceRef, {
          userId: currentUser.uid,
          email: currentUser.email,
          lastSeen: serverTimestamp(),
          isOnline: true
        });
      };
      
      // Initial presence update
      await updatePresence();
      
      // Set up periodic updates
      const presenceInterval = setInterval(updatePresence, 30000);
      
      // Listen to other users' presence
      const presenceQuery = query(
        collection(db, 'presence'),
        where('isOnline', '==', true),
        orderBy('lastSeen', 'desc'),
        limit(20)
      );
      
      const unsubscribePresence = onSnapshot(presenceQuery, (snapshot) => {
        const activeUsers = snapshot.docs
          .map(doc => ({
            userId: doc.data().userId,
            email: doc.data().email,
            lastSeen: doc.data().lastSeen?.toDate() || new Date(),
            editingRoomId: doc.data().editingRoomId
          }))
          .filter(user => user.userId !== currentUser.uid); // Exclude current user
        
        setRealTimeState(prev => ({
          ...prev,
          activeUsers
        }));
      });
      
      // Cleanup function
      return () => {
        clearInterval(presenceInterval);
        unsubscribePresence();
        
        // Mark user as offline
        updateDoc(presenceRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }).catch(console.error);
      };
    } catch (error) {
      logger.error('Failed to setup presence tracking', error);
    }
  }, [currentUser]);

  // Initialize real-time listeners with pagination
  useEffect(() => {
    if (!currentUser) return;
    
    logger.info('Setting up real-time room listeners with pagination');
    
    try {
      // Set up rooms listener with limit for performance
      const roomsQuery = query(
        collection(db, 'rooms'),
        orderBy('updatedAt', 'desc'),
        limit(50) // Limit for performance and cost optimization
      );
      
      unsubscribeRef.current = onSnapshot(
        roomsQuery,
        (snapshot) => {
          setRealTimeState(prev => ({ ...prev, isConnected: true }));
          handleRoomChanges(snapshot);
        },
        (error) => {
          logger.error('Real-time rooms listener error', error);
          setRealTimeState(prev => ({ ...prev, isConnected: false }));
          
          toast({
            title: "Connection Lost",
            description: "Real-time updates are temporarily unavailable",
            variant: "destructive",
          });
        }
      );
      
      // Set up presence tracking
      setupPresenceTracking().then(cleanup => {
        presenceRef.current = cleanup || null;
      });
      
    } catch (error) {
      logger.error('Failed to setup real-time listeners', error);
      setRealTimeState(prev => ({ ...prev, isConnected: false }));
    }
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      if (presenceRef.current) {
        presenceRef.current();
        presenceRef.current = null;
      }
      
      setRealTimeState(prev => ({ ...prev, isConnected: false }));
      logger.info('Real-time listeners cleaned up');
    };
  }, [currentUser, handleRoomChanges, setupPresenceTracking]);

  // Manually trigger room sync
  const syncRooms = useCallback(async () => {
    try {
      logger.info('Manually syncing rooms');
      
      // The onSnapshot listener will automatically handle the sync
      // We just need to indicate sync is happening
      setRealTimeState(prev => ({
        ...prev,
        lastUpdate: new Date()
      }));
      
      toast({
        title: "Sync Complete",
        description: "Room data has been synchronized",
      });
    } catch (error) {
      logger.error('Manual sync failed', error);
      toast({
        title: "Sync Failed",
        description: "Could not synchronize room data",
        variant: "destructive",
      });
    }
  }, []);

  // Clear pending changes
  const clearPendingChanges = useCallback(() => {
    setRealTimeState(prev => ({
      ...prev,
      pendingChanges: [],
      conflictCount: 0
    }));
  }, []);

  // Mark user as editing a specific room
  const setEditingRoom = useCallback(async (roomId: string | null) => {
    if (!currentUser) return;
    
    try {
      const presenceRef = doc(db, 'presence', currentUser.uid);
      await updateDoc(presenceRef, {
        editingRoomId: roomId,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      logger.error('Failed to update editing status', error);
    }
  }, [currentUser]);

  return {
    rooms,
    realTimeState,
    syncRooms,
    clearPendingChanges,
    setEditingRoom,
    isConnected: realTimeState.isConnected,
    lastUpdate: realTimeState.lastUpdate,
    activeUsers: realTimeState.activeUsers,
    pendingChanges: realTimeState.pendingChanges,
    conflictCount: realTimeState.conflictCount
  };
};