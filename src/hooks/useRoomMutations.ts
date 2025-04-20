
import { useState, useCallback } from 'react';
import { Room } from "@/types/hotel.types";
import { saveRooms, deleteRoom as deleteRoomService } from "@/services/room/roomService";
import { notifyLocalDataUse, notifySuccess, notifyError } from "@/utils/roomNotifications";

export const useRoomMutations = (
  rooms: Room[],
  setRooms: (rooms: Room[]) => void,
  usingLocalData: boolean,
  setUsingLocalData: (value: boolean) => void,
  hasShownLocalDataToast: boolean,
  setHasShownLocalDataToast: (value: boolean) => void
) => {
  const [loading, setLoading] = useState(false);

  const handleSaveRooms = useCallback(async (updatedRooms: Room[]) => {
    try {
      setLoading(true);
      
      if (usingLocalData) {
        setRooms(updatedRooms);
        notifySuccess(
          "Local changes applied",
          "Your changes have been saved locally. They won't persist after page refresh until database permissions are fixed."
        );
      } else {
        try {
          await saveRooms(updatedRooms);
          setRooms(updatedRooms);
          notifySuccess("Rooms updated", "Your room changes have been saved to the database");
        } catch (err) {
          const isPermissionError = (err as any)?.code === 'permission-denied';
          
          if (isPermissionError) {
            setUsingLocalData(true);
            setRooms(updatedRooms);
            notifyLocalDataUse(hasShownLocalDataToast, setHasShownLocalDataToast);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error("Error saving rooms:", err);
      notifyError("Failed to save room changes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [usingLocalData, hasShownLocalDataToast, setHasShownLocalDataToast, setRooms, setUsingLocalData]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    try {
      setLoading(true);
      
      if (usingLocalData) {
        const updatedRooms = rooms.filter(room => room.id !== roomId);
        setRooms(updatedRooms);
        notifySuccess("Room deleted locally", "The room has been removed from your local view");
      } else {
        try {
          await deleteRoomService(roomId);
          const updatedRooms = rooms.filter(room => room.id !== roomId);
          setRooms(updatedRooms);
          notifySuccess("Room deleted", "The room has been removed from your offerings");
        } catch (err) {
          const isPermissionError = (err as any)?.code === 'permission-denied';
          
          if (isPermissionError) {
            setUsingLocalData(true);
            const updatedRooms = rooms.filter(room => room.id !== roomId);
            setRooms(updatedRooms);
            notifyLocalDataUse(hasShownLocalDataToast, setHasShownLocalDataToast);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error("Error deleting room:", err);
      notifyError("Failed to delete room. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [rooms, usingLocalData, hasShownLocalDataToast, setHasShownLocalDataToast, setRooms, setUsingLocalData]);

  return {
    loading,
    handleSaveRooms,
    handleDeleteRoom
  };
};
