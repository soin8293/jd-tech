
import { Room } from "@/types/hotel.types";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";
import { getRooms as fetchRoomsFromService } from "@/services/room/roomService";
import { notifyError } from "./roomNotifications";

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
    
    // No fallback to default rooms - return empty array
    console.log("No rooms found in Firestore");
    setRooms([]);
    setUsingLocalData(false);
    setError("No rooms found in database. Please ensure the rooms collection is properly populated.");
    notifyError("No rooms found in database. Please contact administration.");
    return [];
  } catch (err) {
    console.error("Error loading rooms:", err);
    setError("Failed to load rooms. Please try again.");
    notifyError("Failed to load rooms. Please try again.");
    setRooms([]);
    return [];
  }
};
