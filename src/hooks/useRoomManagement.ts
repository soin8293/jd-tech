
import { useState, useCallback, useMemo, useEffect } from "react";
import { Room } from "@/types/hotel.types";
import { useToast } from "@/hooks/use-toast";
import { getRooms as fetchRoomsFromService, saveRooms, deleteRoom } from "@/services/room/roomService";
import { hotelRooms } from "@/data/hotel.data";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";

export const useRoomManagement = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalData, setUsingLocalData] = useState(false);
  const [hasShownLocalDataToast, setHasShownLocalDataToast] = useState(false);
  
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
      console.log("Fetching rooms in useRoomManagement...");
      
      // First try to fetch directly using our query function
      const roomsData = await fetchRoomsDirectly();
      console.log("Direct query results:", roomsData);
      
      if (roomsData && roomsData.length > 0) {
        console.log("Setting rooms from direct query:", roomsData);
        setRooms(roomsData);
        setError(null);
        setUsingLocalData(false);
        return roomsData; // Return the rooms data for immediate use
      }
      
      // If direct fetch returned empty, try through the service
      console.log("Direct query returned empty, trying through service...");
      const serviceFetchedRooms = await fetchRoomsFromService();
      console.log("Service fetched rooms:", serviceFetchedRooms);
      
      if (serviceFetchedRooms && serviceFetchedRooms.length > 0) {
        setRooms(serviceFetchedRooms);
        setError(null);
        setUsingLocalData(false);
        return serviceFetchedRooms;
      }
      
      // If both methods return empty, use default rooms
      console.log("Both fetch methods returned empty, using default rooms");
      setRooms(hotelRooms);
      setUsingLocalData(true);
      setError("No rooms found in database. Using default rooms.");
      notifyLocalDataUse();
      return hotelRooms;
    } catch (err) {
      console.error("Error loading rooms:", err);
      const isPermissionError = (err as any)?.code === 'permission-denied';
      
      if (isPermissionError) {
        console.log("Permission error detected, using local data instead");
        setRooms(hotelRooms);
        setUsingLocalData(true);
        setError("Database permission error. Using local data until permissions are fixed.");
        notifyLocalDataUse();
        return hotelRooms; // Return the local data for immediate use
      } else {
        setError("Failed to load rooms. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load rooms. Please try again.",
          variant: "destructive",
        });
        
        // Even on error, return hotel rooms rather than empty array
        setRooms(hotelRooms);
        return hotelRooms; 
      }
    } finally {
      setLoading(false);
    }
  }, [toast, notifyLocalDataUse]);

  // Initial fetch on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSaveRooms = useCallback(async (updatedRooms: Room[]) => {
    try {
      setLoading(true);
      
      if (usingLocalData) {
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
            throw err;
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
            throw err;
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

  const returnValue = useMemo(() => ({
    rooms,
    loading,
    error,
    usingLocalData,
    fetchRooms,
    handleSaveRooms,
    handleDeleteRoom
  }), [
    rooms,
    loading,
    error, 
    usingLocalData,
    fetchRooms,
    handleSaveRooms,
    handleDeleteRoom
  ]);

  return returnValue;
};
