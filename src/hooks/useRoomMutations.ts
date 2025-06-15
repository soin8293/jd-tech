
import { useState, useCallback } from 'react';
import { Room } from "@/types/hotel.types";
import { saveRooms, deleteRoom as deleteRoomService } from "@/services/room/roomService";
import { notifySuccess, notifyError } from "@/utils/roomNotifications";

export const useRoomMutations = (
  rooms: Room[],
  setRooms: (rooms: Room[]) => void
) => {
  const [loading, setLoading] = useState(false);

  const handleSaveRooms = useCallback(async (updatedRooms: Room[]) => {
    try {
      setLoading(true);
      
      // REMOVED: Dangerous local data fallback that masks permission issues
      // Now we handle permissions properly with clear error messages
      
      await saveRooms(updatedRooms);
      setRooms(updatedRooms);
      notifySuccess("Rooms updated", "Your room changes have been saved to the database");
      
    } catch (err: any) {
      console.error("Error saving rooms:", err);
      
      // Handle specific permission errors with proper user guidance
      if (err?.code === 'permission-denied') {
        notifyError(
          "Permission Denied", 
          "You don't have permission to modify rooms. Please ensure you're signed in as an admin and try refreshing your permissions."
        );
        return;
      }
      
      // Handle authentication errors
      if (err?.code === 'unauthenticated') {
        notifyError(
          "Authentication Required", 
          "Please sign in to modify rooms. Redirecting to login..."
        );
        return;
      }
      
      // Handle network errors
      if (err?.code === 'unavailable' || err?.message?.includes('network')) {
        notifyError(
          "Network Error", 
          "Unable to connect to the server. Please check your internet connection and try again."
        );
        return;
      }
      
      // Generic error fallback
      notifyError(
        "Save Failed", 
        `Failed to save room changes: ${err?.message || 'Unknown error'}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  }, [setRooms]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    try {
      setLoading(true);
      
      // REMOVED: Dangerous local data fallback that masks permission issues
      // Now we handle permissions properly with clear error messages
      
      await deleteRoomService(roomId);
      const updatedRooms = rooms.filter(room => room.id !== roomId);
      setRooms(updatedRooms);
      notifySuccess("Room deleted", "The room has been removed from your offerings");
      
    } catch (err: any) {
      console.error("Error deleting room:", err);
      
      // Handle specific permission errors with proper user guidance
      if (err?.code === 'permission-denied') {
        notifyError(
          "Permission Denied", 
          "You don't have permission to delete rooms. Please ensure you're signed in as an admin and try refreshing your permissions."
        );
        return;
      }
      
      // Handle authentication errors
      if (err?.code === 'unauthenticated') {
        notifyError(
          "Authentication Required", 
          "Please sign in to delete rooms. Redirecting to login..."
        );
        return;
      }
      
      // Handle network errors
      if (err?.code === 'unavailable' || err?.message?.includes('network')) {
        notifyError(
          "Network Error", 
          "Unable to connect to the server. Please check your internet connection and try again."
        );
        return;
      }
      
      // Handle room not found
      if (err?.code === 'not-found') {
        notifyError(
          "Room Not Found", 
          "The room you're trying to delete no longer exists. Refreshing the room list..."
        );
        // Refresh room list to sync with server state
        window.location.reload();
        return;
      }
      
      // Generic error fallback
      notifyError(
        "Delete Failed", 
        `Failed to delete room: ${err?.message || 'Unknown error'}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  }, [rooms, setRooms]);

  return {
    loading,
    handleSaveRooms,
    handleDeleteRoom
  };
};
