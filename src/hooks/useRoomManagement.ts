
import { useState, useCallback, useEffect } from "react";
import { Room } from "@/types/hotel.types";
import { useToast } from "@/hooks/use-toast";
import { getRooms, saveRooms, deleteRoom } from "@/services/roomService";
import { hotelRooms } from "@/data/hotel.data";

export const useRoomManagement = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalData, setUsingLocalData] = useState(false);
  const [hasShownLocalDataToast, setHasShownLocalDataToast] = useState(false);
  
  // Create a stable reference for toast notifications
  const notifyLocalDataUse = useCallback(() => {
    if (!hasShownLocalDataToast) {
      toast({
        title: "Using Local Data",
        description: "Unable to access database due to permissions. Using local data for now.",
        variant: "default",
      });
      setHasShownLocalDataToast(true);
    }
  }, [toast, hasShownLocalDataToast]);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching rooms...");
      const roomsData = await getRooms();
      console.log("Rooms data received:", roomsData);
      setRooms(roomsData);
      setError(null);
      setUsingLocalData(false);
    } catch (err) {
      console.error("Error loading rooms:", err);
      const isPermissionError = (err as any)?.code === 'permission-denied';
      
      if (isPermissionError) {
        console.log("Permission error detected, using local data instead");
        setRooms(hotelRooms);
        setUsingLocalData(true);
        setError("Database permission error. Using local data until permissions are fixed.");
        notifyLocalDataUse();
      } else {
        setError("Failed to load rooms. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load rooms. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [notifyLocalDataUse, toast]);

  const handleSaveRooms = useCallback(async (updatedRooms: Room[]) => {
    try {
      setLoading(true);
      
      if (usingLocalData) {
        // If already using local data, just update state without notification
        setRooms(updatedRooms);
        toast({
          title: "Local changes applied",
          description: "Your changes have been saved locally. They won't persist after page refresh until database permissions are fixed.",
          variant: "default",
        });
      } else {
        try {
          await saveRooms(updatedRooms);
          setRooms(updatedRooms);
          toast({
            title: "Rooms updated",
            description: "Your room changes have been saved to the database",
          });
        } catch (err) {
          const isPermissionError = (err as any)?.code === 'permission-denied';
          
          if (isPermissionError) {
            setUsingLocalData(true);
            setRooms(updatedRooms);
            setError("Database permission error. Using local data until permissions are fixed.");
            notifyLocalDataUse();
          } else {
            throw err; // Re-throw non-permission errors
          }
        }
      }
    } catch (err) {
      console.error("Error saving rooms:", err);
      toast({
        title: "Error",
        description: "Failed to save room changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [usingLocalData, toast, notifyLocalDataUse]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    try {
      setLoading(true);
      
      if (usingLocalData) {
        // If already using local data, just update state without notification
        const updatedRooms = rooms.filter(room => room.id !== roomId);
        setRooms(updatedRooms);
        toast({
          title: "Room deleted locally",
          description: "The room has been removed from your local view",
          variant: "default",
        });
      } else {
        try {
          await deleteRoom(roomId);
          const updatedRooms = rooms.filter(room => room.id !== roomId);
          setRooms(updatedRooms);
          toast({
            title: "Room deleted",
            description: "The room has been removed from your offerings",
          });
        } catch (err) {
          const isPermissionError = (err as any)?.code === 'permission-denied';
          
          if (isPermissionError) {
            setUsingLocalData(true);
            const updatedRooms = rooms.filter(room => room.id !== roomId);
            setRooms(updatedRooms);
            setError("Database permission error. Using local data until permissions are fixed.");
            notifyLocalDataUse();
          } else {
            throw err; // Re-throw non-permission errors
          }
        }
      }
    } catch (err) {
      console.error("Error deleting room:", err);
      toast({
        title: "Error",
        description: "Failed to delete room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [rooms, usingLocalData, toast, notifyLocalDataUse]);

  return {
    rooms,
    loading,
    error,
    usingLocalData,
    fetchRooms,
    handleSaveRooms,
    handleDeleteRoom
  };
};
