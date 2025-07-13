import { useState, useCallback } from "react";
import { Room } from "@/types/hotel.types";
import { saveRoom, saveRooms, deleteRoom } from "@/services/room/roomMutations";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export const useSimpleRoomMutations = (
  setRooms: (rooms: Room[]) => void
) => {
  const [loading, setLoading] = useState(false);

  // Handle save rooms with simple error handling
  const handleSaveRooms = useCallback(async (rooms: Room[]) => {
    logger.info('Starting simple room save operation', { 
      roomCount: rooms.length
    });

    try {
      setLoading(true);
      
      // Save rooms to Firebase
      await saveRooms(rooms);
      
      // Update local state
      setRooms(rooms);

      toast({
        title: "Rooms Saved",
        description: `Successfully saved ${rooms.length} room(s)`,
      });

    } catch (error: any) {
      logger.error('Room save operation failed', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setRooms]);

  // Handle delete room with simple error handling
  const handleDeleteRoom = useCallback(async (roomId: string, currentRooms: Room[]) => {
    logger.info('Starting simple room deletion', { roomId });

    try {
      setLoading(true);
      
      const roomToDelete = currentRooms.find(r => r.id === roomId);
      if (!roomToDelete) {
        throw new Error('Room not found');
      }

      // Delete from Firebase
      await deleteRoom(roomId);
      
      // Update local state
      const updatedRooms = currentRooms.filter(r => r.id !== roomId);
      setRooms(updatedRooms);

      toast({
        title: "Room Deleted",
        description: `Room "${roomToDelete.name}" has been deleted`,
      });

    } catch (error: any) {
      logger.error('Room deletion failed', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setRooms]);

  return {
    loading,
    handleSaveRooms,
    handleDeleteRoom
  };
};