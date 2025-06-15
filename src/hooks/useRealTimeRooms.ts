import React from "react";
import { useRealTimeSync } from "./useRealTimeSync";
import { useRoomChangeDetection } from "./useRoomChangeDetection";
import { useRealTimePresence } from "./useRealTimePresence";

// Re-export types for backward compatibility
export type { RoomChange } from "./useRoomChangeDetection";
export type { RealTimeUserPresence } from "./useRealTimePresence";

export interface RealTimeRoomsState {
  rooms: any[];
  isConnected: boolean;
  lastSyncTime?: Date;
  lastUpdate?: Date;
  recentChanges: any[];
  onlineUsers: any[];
  activeUsers: any[];
  currentUserCount: number;
  pendingChanges: any[];
  conflictCount: number;
}

export const useRealTimeRooms = (
  maxRooms: number = 50, 
  enableChangeNotifications: boolean = true,
  onRoomChange?: (change: any) => void,
  onConflict?: (conflictedRoom: any, serverRoom: any) => void
) => {
  const {
    rooms,
    isConnected: syncConnected,
    lastSyncTime,
    error: syncError
  } = useRealTimeSync(maxRooms);

  const {
    recentChanges,
    changeCount,
    lastChangeTime,
    detectChanges,
    clearChanges,
    getRoomChanges
  } = useRoomChangeDetection();

  const {
    onlineUsers,
    isConnected: presenceConnected,
    currentUserCount,
    getUsersEditingRoom,
    isUserOnline
  } = useRealTimePresence();

  // Detect changes when rooms update
  React.useEffect(() => {
    if (rooms.length > 0) {
      const changes = detectChanges(rooms, enableChangeNotifications);
      if (changes.length > 0 && onRoomChange) {
        changes.forEach(change => onRoomChange(change));
      }
    }
  }, [rooms, detectChanges, enableChangeNotifications, onRoomChange]);

  // Dummy sync function for backward compatibility
  const syncRooms = React.useCallback(async () => {
    // The real-time sync is automatic, this is just for compatibility
    console.log('Manual sync requested - real-time sync is automatic');
  }, []);

  // Clear pending changes - maps to clearChanges
  const clearPendingChanges = React.useCallback(() => {
    clearChanges();
  }, [clearChanges]);

  // Combined state for backward compatibility
  const realTimeState: RealTimeRoomsState = {
    rooms,
    isConnected: syncConnected && presenceConnected,
    lastSyncTime,
    lastUpdate: lastChangeTime,
    recentChanges,
    onlineUsers,
    activeUsers: onlineUsers, // Alias for backward compatibility
    currentUserCount,
    pendingChanges: recentChanges, // Alias for backward compatibility
    conflictCount: 0 // Not implemented in new architecture
  };

  return {
    realTimeState,
    // Room sync
    rooms,
    isConnected: syncConnected,
    lastSyncTime,
    lastUpdate: lastChangeTime,
    syncError,
    syncRooms,
    // Change detection
    recentChanges,
    changeCount,
    lastChangeTime,
    clearChanges,
    clearPendingChanges,
    getRoomChanges,
    // Presence
    onlineUsers,
    activeUsers: onlineUsers,
    currentUserCount,
    getUsersEditingRoom,
    isUserOnline,
    presenceConnected,
    // Backward compatibility
    pendingChanges: recentChanges,
    conflictCount: 0
  };
};