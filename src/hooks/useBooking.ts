/**
 * Custom hook for managing booking state and operations
 * Centralizes booking logic and provides a clean interface for components
 */

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Room, BookingPeriod, BookingDetails, RoomAvailabilityCheck } from "@/types/hotel.types";
import { 
  bookingService, 
  validateBooking, 
  formatBookingConfirmation 
} from "@/services/bookingService";

export interface UseBookingReturn {
  // State
  selectedRooms: Room[];
  bookingPeriod: BookingPeriod;
  guests: number;
  bookingDetails: BookingDetails | null;
  isProcessing: boolean;
  
  // Actions
  setBookingPeriod: (period: BookingPeriod) => void;
  setGuests: (guests: number) => void;
  selectRoom: (room: Room, availability?: RoomAvailabilityCheck) => void;
  deselectRoom: (roomId: string) => void;
  clearSelectedRooms: () => void;
  createBooking: (userEmail?: string) => Promise<BookingDetails | null>;
  resetBooking: () => void;
  
  // Computed values
  hasSelectedRooms: boolean;
  totalPrice: number;
  numberOfNights: number;
}

export const useBooking = (
  initialPeriod?: BookingPeriod,
  initialGuests: number = 2
): UseBookingReturn => {
  const { toast } = useToast();
  
  // State
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>(
    initialPeriod || {
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
  );
  const [guests, setGuests] = useState<number>(initialGuests);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  /**
   * Select a room for booking
   */
  const selectRoom = useCallback((room: Room, availability?: RoomAvailabilityCheck) => {
    // Check availability if provided
    if (availability && !availability.isAvailable) {
      toast({
        title: "Room Unavailable",
        description: availability.unavailableReason || "This room is not available for the selected dates.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedRooms(current => {
      const isAlreadySelected = current.some(r => r.id === room.id);
      
      if (isAlreadySelected) {
        // Room already selected, do nothing or show message
        toast({
          title: "Room Already Selected",
          description: `${room.name} is already in your selection.`,
          variant: "default",
        });
        return current;
      }
      
      // Add room to selection
      const newSelection = [...current, room];
      
      toast({
        title: "Room Added",
        description: `${room.name} has been added to your booking.`,
        variant: "default",
      });
      
      return newSelection;
    });
  }, [toast]);

  /**
   * Deselect a room from booking
   */
  const deselectRoom = useCallback((roomId: string) => {
    setSelectedRooms(current => {
      const room = current.find(r => r.id === roomId);
      const filtered = current.filter(r => r.id !== roomId);
      
      if (room) {
        toast({
          title: "Room Removed",
          description: `${room.name} has been removed from your booking.`,
          variant: "default",
        });
      }
      
      return filtered;
    });
  }, [toast]);

  /**
   * Clear all selected rooms
   */
  const clearSelectedRooms = useCallback(() => {
    setSelectedRooms([]);
    toast({
      title: "Selection Cleared",
      description: "All rooms have been removed from your booking.",
      variant: "default",
    });
  }, [toast]);

  /**
   * Create booking details
   */
  const createBooking = useCallback(async (userEmail?: string): Promise<BookingDetails | null> => {
    setIsProcessing(true);
    
    try {
      // Validate booking
      const validation = validateBooking(selectedRooms, bookingPeriod, guests);
      
      if (!validation.isValid) {
        toast({
          title: "Booking Error",
          description: validation.errors[0], // Show first error
          variant: "destructive",
        });
        return null;
      }

      // Process booking
      const details = await bookingService.processBooking(
        selectedRooms,
        bookingPeriod,
        guests,
        userEmail
      );
      
      setBookingDetails(details);
      
      toast({
        title: "Booking Created",
        description: "Your booking is ready for payment.",
        variant: "default",
      });
      
      return details;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create booking";
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRooms, bookingPeriod, guests, toast]);

  /**
   * Reset booking state
   */
  const resetBooking = useCallback(() => {
    setSelectedRooms([]);
    setBookingDetails(null);
    setIsProcessing(false);
  }, []);

  // Computed values
  const hasSelectedRooms = selectedRooms.length > 0;
  const totalPrice = selectedRooms.reduce((sum, room) => {
    const nights = Math.max(1, Math.ceil((bookingPeriod.checkOut.getTime() - bookingPeriod.checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    return sum + (room.price * nights);
  }, 0);
  const numberOfNights = Math.max(1, Math.ceil((bookingPeriod.checkOut.getTime() - bookingPeriod.checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    // State
    selectedRooms,
    bookingPeriod,
    guests,
    bookingDetails,
    isProcessing,
    
    // Actions
    setBookingPeriod,
    setGuests,
    selectRoom,
    deselectRoom,
    clearSelectedRooms,
    createBooking,
    resetBooking,
    
    // Computed values
    hasSelectedRooms,
    totalPrice,
    numberOfNights
  };
};