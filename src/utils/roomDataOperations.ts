
import { Room } from "@/types/hotel.types";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";
import { getRooms as fetchRoomsFromService } from "@/services/room/roomService";
import { hotelRooms } from "@/data/hotel.data";
import { notifyLocalDataUse, notifyError } from "./roomNotifications";

export const fetchRoomData = async (
  setRooms: (rooms: Room[]) => void,
  setError: (error: string | null) => void,
  setUsingLocalData: (value: boolean) => void,
  hasShownLocalDataToast: boolean,
  setHasShownLocalDataToast: (value: boolean) => void
) => {
  try {
    console.log("Fetching rooms in useRoomManagement...");
    
    // First try direct query
    const roomsData = await fetchRoomsDirectly();
    console.log("Direct query results:", roomsData);
    
    if (roomsData && roomsData.length > 0) {
      console.log("Setting rooms from direct query:", roomsData);
      setRooms(roomsData);
      setError(null);
      setUsingLocalData(false);
      return roomsData;
    }
    
    // Try through service if direct query returns empty
    console.log("Direct query returned empty, trying through service...");
    const serviceFetchedRooms = await fetchRoomsFromService();
    console.log("Service fetched rooms:", serviceFetchedRooms);
    
    if (serviceFetchedRooms && serviceFetchedRooms.length > 0) {
      setRooms(serviceFetchedRooms);
      setError(null);
      setUsingLocalData(false);
      return serviceFetchedRooms;
    }
    
    // Use default rooms if both methods return empty
    console.log("Both fetch methods returned empty, using default rooms");
    setRooms(hotelRooms);
    setUsingLocalData(true);
    setError("No rooms found in database. Using default rooms.");
    notifyLocalDataUse(hasShownLocalDataToast, setHasShownLocalDataToast);
    return hotelRooms;
  } catch (err) {
    console.error("Error loading rooms:", err);
    const isPermissionError = (err as any)?.code === 'permission-denied';
    
    if (isPermissionError) {
      console.log("Permission error detected, using local data instead");
      setRooms(hotelRooms);
      setUsingLocalData(true);
      setError("Database permission error. Using local data until permissions are fixed.");
      notifyLocalDataUse(hasShownLocalDataToast, setHasShownLocalDataToast);
      return hotelRooms;
    }
    
    setError("Failed to load rooms. Please try again.");
    notifyError("Failed to load rooms. Please try again.");
    setRooms(hotelRooms);
    return hotelRooms;
  }
};
