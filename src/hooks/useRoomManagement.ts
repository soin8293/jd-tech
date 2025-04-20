
import { useState, useCallback, useMemo, useEffect } from "react";
import { Room } from "@/types/hotel.types";
import { fetchRoomData } from "@/utils/roomDataOperations";
import { useRoomMutations } from "./useRoomMutations";

export const useRoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalData, setUsingLocalData] = useState(false);
  const [hasShownLocalDataToast, setHasShownLocalDataToast] = useState(false);
  
  const { loading: mutationLoading, handleSaveRooms, handleDeleteRoom } = useRoomMutations(
    rooms,
    setRooms,
    usingLocalData,
    setUsingLocalData,
    hasShownLocalDataToast,
    setHasShownLocalDataToast
  );

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      await fetchRoomData(
        setRooms,
        setError,
        setUsingLocalData,
        hasShownLocalDataToast,
        setHasShownLocalDataToast
      );
    } finally {
      setLoading(false);
    }
  }, [hasShownLocalDataToast]);

  // Initial fetch on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading: loading || mutationLoading,
    error,
    usingLocalData,
    fetchRooms,
    handleSaveRooms,
    handleDeleteRoom
  };
};
