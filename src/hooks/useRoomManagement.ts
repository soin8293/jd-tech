
import { useState, useCallback, useMemo, useEffect } from "react";
import { Room } from "@/types/hotel.types";
import { fetchRoomData } from "@/utils/roomDataOperations";
import { useSimpleRoomMutations } from "./useSimpleRoomMutations";

export const useRoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { loading: mutationLoading, handleSaveRooms, handleDeleteRoom } = useSimpleRoomMutations(
    setRooms
  );

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      // REMOVED: Local data fallback - now uses direct room fetching
      // This will properly throw errors for permission issues
      const { getRooms } = await import("@/services/room/roomQueries");
      const fetchedRooms = await getRooms();
      setRooms(fetchedRooms);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching rooms:", err);
      setError(`Failed to load rooms: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading: loading || mutationLoading,
    error,
    fetchRooms,
    handleSaveRooms,
    handleDeleteRoom: (roomId: string) => handleDeleteRoom(roomId, rooms)
  };
};
