
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Room } from "@/types/hotel.types";
import { getRooms, getRoom } from "@/services/room/roomService";
import { saveRooms, deleteRoom } from "@/services/room/roomService";
import { notifySuccess, notifyError } from "@/utils/roomNotifications";

export const useRoomQuery = () => {
  const queryClient = useQueryClient();

  // Fetch all rooms
  const { 
    data: rooms = [], 
    isLoading, 
    error 
  } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: getRooms,
    staleTime: 5000, // 5 seconds cache
  });

  // Fetch a single room
  const useSingleRoom = (roomId: string) => {
    return useQuery<Room | null>({
      queryKey: ['room', roomId],
      queryFn: () => getRoom(roomId),
    });
  };

  // Mutation for saving rooms
  const saveRoomsMutation = useMutation({
    mutationFn: saveRooms,
    onSuccess: () => {
      // Invalidate and refetch rooms query
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
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
      // Remove the deleted room from cache
      queryClient.setQueryData(['rooms'], (oldRooms: Room[] = []) => 
        oldRooms.filter(room => room.id !== roomId)
      );
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
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
