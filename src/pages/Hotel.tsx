import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { BookingPeriod, Room, BookingDetails, RoomAvailabilityCheck } from "@/types/hotel.types";
import { hotelRooms } from "@/data/hotel.data";
import HotelHeader from "@/components/hotel/HotelHeader";
import BookingForm from "@/components/hotel/BookingForm";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { getRooms, getAvailableRooms } from "@/services/room/roomService";
import { checkRoomAvailability } from "@/utils/availabilityUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { addDays, differenceInDays, format } from "date-fns";
import PaymentModal from "@/components/payment/PaymentModal";
import RoomList from "@/components/hotel/RoomList";

const Hotel = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>({
    checkIn: new Date(),
    checkOut: addDays(new Date(), 3),
  });
  const [guests, setGuests] = useState<number>(2);
  const [availableRooms, setAvailableRooms] = useState<Room[]>(hotelRooms);
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomAvailabilityCheck>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchRooms = async (period: BookingPeriod, guestCount: number) => {
    setIsLoading(true);
    setBookingPeriod(period);
    setGuests(guestCount);
    setHasSearched(true);
    
    try {
      const roomsData = await getAvailableRooms(period.checkIn, period.checkOut);
      const filteredRooms = roomsData.filter(room => room.capacity >= guestCount);
      setAvailableRooms(filteredRooms);
      
      const availabilityChecks: Record<string, RoomAvailabilityCheck> = {};
      filteredRooms.forEach(room => {
        availabilityChecks[room.id] = checkRoomAvailability(room, period);
      });
      
      setRoomAvailability(availabilityChecks);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      
      const filteredRooms = hotelRooms.filter(room => room.capacity >= guestCount);
      setAvailableRooms(filteredRooms);
      
      toast({
        title: "Error fetching rooms",
        description: "Using local data instead. Some availability information may not be accurate.",
        variant: "destructive",
      });
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
    
    // Store user email in localStorage for booking confirmation
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

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <HotelHeader />
      
      <div className={cn(
        "container mx-auto px-4 md:px-6 relative z-10",
        isMobile ? "-mt-32" : "-mt-12"
      )}>
        <div className="flex justify-between items-center">
          <BookingForm 
            onSearch={handleSearchRooms} 
            className="mb-10"
            isLoading={isLoading}
          />
          
          {currentUser?.email === "amirahcolorado@gmail.com" && (
            <div className="flex gap-2">
              <InitializeAdmin />
            </div>
          )}
        </div>
        
        {hasSearched && (
          <div className="mt-6">
            <RoomList 
              rooms={availableRooms}
              selectedRooms={selectedRooms}
              onSelectRoom={handleSelectRoom}
              bookingPeriod={bookingPeriod}
              roomAvailability={roomAvailability}
              onBookNow={handleBookNow}
              context="booking"
              showEditButtons={false}
              isLoading={isLoading}
            />
          </div>
        )}

        {bookingDetails && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            bookingDetails={bookingDetails}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    </div>
  );
};

export default Hotel;
