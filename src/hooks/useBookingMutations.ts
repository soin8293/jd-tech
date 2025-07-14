import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ManualBookingData {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  paymentStatus?: "pending" | "paid" | "invoice";
  totalAmount?: number;
}

export const useBookingMutations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const cancelBookingFn = httpsCallable(functions, 'cancelBooking');
  const createManualBookingFn = httpsCallable(functions, 'createManualBooking');

  const cancelBooking = async (bookingId: string, reason?: string) => {
    setIsLoading(true);
    try {
      const result = await cancelBookingFn({ bookingId, reason });
      
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
      
      return result.data;
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createManualBooking = async (bookingData: ManualBookingData) => {
    setIsLoading(true);
    try {
      const result = await createManualBookingFn(bookingData);
      
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      
      return result.data;
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelBooking,
    createManualBooking,
    isLoading
  };
};