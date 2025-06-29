import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookingPeriod, Room, BookingDetails, RoomAvailabilityCheck } from "@/types/hotel.types";
import { useAuth } from "@/contexts/AuthContext";
import { checkRoomAvailability } from "@/utils/availabilityUtils";
import { addDays, differenceInDays, format } from "date-fns";
import { fetchRoomData } from "@/utils/roomDataOperations";

export const useHotelBooking = () => {
  console.log("🏨 HOTEL BOOKING: ================== USHOTELBOOKING HOOK STARTING ==================");
  
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  console.log("🏨 HOTEL BOOKING: useAuth hook called successfully, currentUser:", currentUser?.email || 'Not logged in');
  
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>({
    checkIn: new Date(),
    checkOut: addDays(new Date(), 3),
  });
  const [guests, setGuests] = useState<number>(2);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomAvailabilityCheck>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [usingLocalData, setUsingLocalData] = useState(false);

  // Load all rooms on component mount
  useEffect(() => {
    const loadRooms = async () => {
      console.log("🏨 HOTEL BOOKING: ================== STARTING ROOM LOAD ==================");
      console.log("🏨 HOTEL BOOKING: useHotelBooking loadRooms triggered at:", new Date().toISOString());
      console.log("🏨 HOTEL BOOKING: Current user:", currentUser?.email || 'Not logged in');
      
      setIsLoading(true);
      try {
        console.log("🏨 HOTEL BOOKING: About to call fetchRoomData...");
        const fetchedRooms = await fetchRoomData(
          (rooms) => {
            console.log("🏨 HOTEL BOOKING: setAllRooms called with:", rooms?.length, "rooms");
            setAllRooms(rooms);
          },
          (error) => {
            console.log("🏨 HOTEL BOOKING: Error setter called with:", error);
          }, // error setter - we'll handle this locally
          (usingLocal) => {
            console.log("🏨 HOTEL BOOKING: setUsingLocalData called with:", usingLocal);
            setUsingLocalData(usingLocal);
          },
          false, // hasShownLocalDataToast
          () => {} // setHasShownLocalDataToast
        );
        console.log("🏨 HOTEL BOOKING: fetchRoomData returned:", fetchedRooms?.length, "rooms");
        console.log("🏨 HOTEL BOOKING: Room IDs:", fetchedRooms?.map(r => r.id) || []);
      } catch (error) {
        console.error("🏨 HOTEL BOOKING: ❌ Error loading rooms:", error);
        console.error("🏨 HOTEL BOOKING: Error details:", {
          name: error?.name,
          message: error?.message,
          code: error?.code
        });
      } finally {
        setIsLoading(false);
        console.log("🏨 HOTEL BOOKING: Room loading completed, isLoading set to false");
      }
    };

    loadRooms();
  }, []);

  const handleSearchRooms = async (period: BookingPeriod, guestCount: number) => {
    setIsLoading(true);
    setBookingPeriod(period);
    setGuests(guestCount);
    setHasSearched(true);
    
    try {
      // Filter rooms based on capacity and availability
      const filteredRooms = allRooms.filter(room => room.capacity >= guestCount);
      setAvailableRooms(filteredRooms);
      
      const availabilityChecks: Record<string, RoomAvailabilityCheck> = {};
      filteredRooms.forEach(room => {
        availabilityChecks[room.id] = checkRoomAvailability(room, period);
      });
      
      setRoomAvailability(availabilityChecks);
    } catch (error) {
      console.error("Error filtering rooms:", error);
      
      toast({
        title: "Error filtering rooms",
        description: "Unable to filter room data. Please try again.",
        variant: "destructive",
      });
      
      setAvailableRooms([]);
    } finally {
      setIsLoading(false);
      setSelectedRooms([]);
    }
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
    
    if (selectedRooms.length > 0) {
      const updatedAvailability = { ...roomAvailability };
      
      selectedRooms.forEach(room => {
        updatedAvailability[room.id] = {
          isAvailable: false,
          unavailableReason: "This room was just booked by you"
        };
      });
      
      setRoomAvailability(updatedAvailability);
    }
    
    setSelectedRooms([]);
  };

  console.log("🏨 HOTEL BOOKING: useHotelBooking hook returning values successfully");

  return {
    selectedRooms,
    bookingPeriod,
    guests,
    availableRooms,
    roomAvailability,
    hasSearched,
    isPaymentModalOpen,
    bookingDetails,
    isLoading,
    usingLocalData,
    currentUser,
    handleSearchRooms,
    handleSelectRoom,
    handleBookNow,
    handlePaymentComplete,
    setPaymentModalOpen
  };
};
