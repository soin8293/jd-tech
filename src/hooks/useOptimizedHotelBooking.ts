import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookingPeriod, Room, BookingDetails } from "@/types/hotel.types";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, format } from "date-fns";
import { useOptimizedRoomSearch } from "./useOptimizedRoomSearch";

export const useOptimizedHotelBooking = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>({
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  });
  const [guests, setGuests] = useState<number>(2);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const {
    paginatedRooms,
    roomAvailability,
    isLoading,
    hasSearched,
    usingLocalData,
    currentPage,
    totalPages,
    totalResults,
    setCurrentPage,
    searchRooms,
    clearCache
  } = useOptimizedRoomSearch();

  const handleSearchRooms = async (period: BookingPeriod, guestCount: number) => {
    setBookingPeriod(period);
    setGuests(guestCount);
    setSelectedRooms([]); // Clear selections on new search
    await searchRooms(period, guestCount);
  };

  const handleSelectRoom = (room: Room) => {
    const availability = roomAvailability[room.id];
    if (availability && !availability.isAvailable) {
      toast({
        title: "Room Unavailable",
        description: availability.unavailableReason || "This room is not available for the selected dates.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedRooms(current => {
      const isSelected = current.some(r => r.id === room.id);
      return isSelected ? current.filter(r => r.id !== room.id) : [...current, room];
    });
  };

  const handleBookNow = () => {
    if (selectedRooms.length === 0) {
      toast({
        title: "No rooms selected",
        description: "Please select at least one room to continue.",
        variant: "destructive",
      });
      return;
    }
    
    const nights = differenceInDays(bookingPeriod.checkOut, bookingPeriod.checkIn);
    const totalPrice = selectedRooms.reduce((sum, room) => sum + (room.price * nights), 0);
    
    const details: BookingDetails = {
      period: bookingPeriod,
      guests,
      rooms: selectedRooms,
      totalPrice
    };
    
    if (currentUser?.email) {
      localStorage.setItem('userEmail', currentUser.email);
    }
    
    setBookingDetails(details);
    setPaymentModalOpen(true);
  };
  
  const handlePaymentComplete = () => {
    setPaymentModalOpen(false);
    
    toast({
      title: "Booking Confirmed!",
      description: `You have successfully booked ${selectedRooms.length} room(s) from ${format(bookingPeriod.checkIn, "MMM d, yyyy")} to ${format(bookingPeriod.checkOut, "MMM d, yyyy")}.`,
    });
    
    setSelectedRooms([]);
    clearCache(); // Clear cache after booking to ensure fresh data
  };

  return {
    // Room data
    availableRooms: paginatedRooms,
    roomAvailability,
    
    // Booking state
    selectedRooms,
    bookingPeriod,
    guests,
    
    // Modal state
    isPaymentModalOpen,
    bookingDetails,
    
    // Loading and search state
    isLoading,
    hasSearched,
    usingLocalData,
    
    // Pagination
    currentPage,
    totalPages,
    totalResults,
    setCurrentPage,
    
    // Auth
    currentUser,
    
    // Actions
    handleSearchRooms,
    handleSelectRoom,
    handleBookNow,
    handlePaymentComplete,
    setPaymentModalOpen,
    clearCache
  };
};