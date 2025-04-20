
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Room } from "@/types/hotel.types";
import { getRooms, getRoom } from "@/services/room/roomService";
import { saveRooms, deleteRoom } from "@/services/room/roomService";
import { notifySuccess, notifyError } from "@/utils/roomNotifications";

export const useRoomQuery = () => {
  // Safe check if we're in a QueryClientProvider context
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    console.warn("useRoomQuery: QueryClient not found, some functionality may be limited");
    // Continue without the queryClient - we'll handle this case
  }

  // Fetch all rooms
  const { 
    data: rooms = [], 
    isLoading, 
    error 
  } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: getRooms,
    staleTime: 5000, // 5 seconds cache
    enabled: !!queryClient, // Only enable the query if we have a queryClient
  });

  // Fetch a single room
  const useSingleRoom = (roomId: string) => {
    return useQuery<Room | null>({
      queryKey: ['room', roomId],
      queryFn: () => getRoom(roomId),
      enabled: !!queryClient && !!roomId, // Only enable if we have both a queryClient and a roomId
    });
  };

  // Mutation for saving rooms
  const saveRoomsMutation = useMutation({
    mutationFn: saveRooms,
    onSuccess: () => {
      // Invalidate and refetch rooms query if we have a queryClient
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      }
      notifySuccess("Rooms Updated", "Room changes have been saved successfully");
    },
    onError: (error) => {
      console.error("Error saving rooms:", error);
      notifyError("Failed to save room changes");
    }
  });

  // Mutation for deleting a room
  const deleteRoomMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: (_, roomId) => {
      // Update cache if we have a queryClient
      if (queryClient) {
        queryClient.setQueryData(['rooms'], (oldRooms: Room[] = []) => 
          oldRooms.filter(room => room.id !== roomId)
        );
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      }
      notifySuccess("Room Deleted", "The room has been removed from your offerings");
    },
    onError: (error) => {
      console.error("Error deleting room:", error);
      notifyError("Failed to delete room");
    }
  });

  return {
    rooms,
    isLoading,
    error,
    useSingleRoom,
    saveRoomsMutation,
    deleteRoomMutation
  };
};
