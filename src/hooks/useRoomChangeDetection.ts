import { useState, useCallback, useRef } from "react";
import { Room } from "@/types/hotel.types";
import { logger } from "@/utils/logger";
import { toast } from "@/hooks/use-toast";

export interface RoomChange {
  type: 'added' | 'modified' | 'removed';
  room: Room;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  changeDetails?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface ChangeDetectionState {
  recentChanges: RoomChange[];
  changeCount: number;
  lastChangeTime?: Date;
}

export const useRoomChangeDetection = () => {
  const [changeState, setChangeState] = useState<ChangeDetectionState>({
    recentChanges: [],
    changeCount: 0
  });

  const prevRoomsRef = useRef<Room[]>([]);
  const maxRecentChanges = 10;

  // Detect changes between room arrays
  const detectChanges = useCallback((newRooms: Room[], showNotifications: boolean = true) => {
    const prevRooms = prevRoomsRef.current;
    const changes: RoomChange[] = [];

    // Create maps for efficient lookup
    const prevRoomMap = new Map(prevRooms.map(room => [room.id, room]));
    const newRoomMap = new Map(newRooms.map(room => [room.id, room]));

    // Detect additions and modifications
    newRooms.forEach(newRoom => {
      const prevRoom = prevRoomMap.get(newRoom.id);
      
      if (!prevRoom) {
        // Room added
        changes.push({
          type: 'added',
          room: newRoom,
          timestamp: new Date()
        });
        
        if (showNotifications) {
          toast({
            title: "Room Added",
            description: `${newRoom.name} has been added`,
          });
        }
      } else {
        // Check for modifications
        const changeDetails = detectRoomFieldChanges(prevRoom, newRoom);
        
        if (changeDetails.length > 0) {
          changes.push({
            type: 'modified',
            room: newRoom,
            timestamp: new Date(),
            changeDetails
          });
          
          if (showNotifications) {
            toast({
              title: "Room Updated",
              description: `${newRoom.name} has been modified`,
            });
          }
        }
      }
    });

    // Detect removals
    prevRooms.forEach(prevRoom => {
      if (!newRoomMap.has(prevRoom.id)) {
        changes.push({
          type: 'removed',
          room: prevRoom,
          timestamp: new Date()
        });
        
        if (showNotifications) {
          toast({
            title: "Room Removed",
            description: `${prevRoom.name} has been removed`,
            variant: "destructive",
          });
        }
      }
    });

    if (changes.length > 0) {
      setChangeState(prev => ({
        recentChanges: [...changes, ...prev.recentChanges].slice(0, maxRecentChanges),
        changeCount: prev.changeCount + changes.length,
        lastChangeTime: new Date()
      }));

      logger.info('Room changes detected', { 
        changeCount: changes.length,
        types: changes.map(c => c.type)
      });
    }

    // Update reference
    prevRoomsRef.current = newRooms;

    return changes;
  }, []);

  // Detect specific field changes between rooms
  const detectRoomFieldChanges = useCallback((oldRoom: Room, newRoom: Room) => {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    const fieldsToCheck = ['name', 'price', 'availability', 'description', 'capacity'];
    
    fieldsToCheck.forEach(field => {
      const oldValue = (oldRoom as any)[field];
      const newValue = (newRoom as any)[field];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    });

    return changes;
  }, []);

  // Clear change history
  const clearChanges = useCallback(() => {
    setChangeState({
      recentChanges: [],
      changeCount: 0
    });
  }, []);

  // Get changes for a specific room
  const getRoomChanges = useCallback((roomId: string): RoomChange[] => {
    return changeState.recentChanges.filter(change => change.room.id === roomId);
  }, [changeState.recentChanges]);

  return {
    changeState,
    detectChanges,
    clearChanges,
    getRoomChanges,
    recentChanges: changeState.recentChanges,
    changeCount: changeState.changeCount,
    lastChangeTime: changeState.lastChangeTime
  };
};