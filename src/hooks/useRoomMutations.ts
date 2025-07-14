import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/types/hotel.types';

export const useRoomMutations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateRoomDetails = httpsCallable(functions, 'updateRoomDetails');
  const deleteRoomSecure = httpsCallable(functions, 'deleteRoomSecure');

  const updateRoom = async (roomId: string, roomData: Partial<Room>, imagesToDelete: string[] = []) => {
    setIsLoading(true);
    try {
      const result = await updateRoomDetails({ roomId, roomData, imagesToDelete });
      
      toast({
        title: "Success",
        description: "Room updated successfully",
      });
      
      return result.data;
    } catch (error: any) {
      console.error('Failed to update room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update room",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteRoomSecure({ roomId });
      
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      
      return result.data;
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateRoom,
    deleteRoom,
    isLoading
  };
};