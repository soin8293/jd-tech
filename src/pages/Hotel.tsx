import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { BookingPeriod, Room, BookingDetails } from "@/types/hotel.types";
import { hotelRooms } from "@/data/hotel.data";
import HotelHeader from "@/components/hotel/HotelHeader";
import BookingForm from "@/components/hotel/BookingForm";
import RoomCard from "@/components/hotel/RoomCard";
import BookingSummary from "@/components/hotel/BookingSummary";
import PaymentModal from "@/components/payment/PaymentModal";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import { useAuth } from "@/contexts/AuthContext";

const Hotel = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>({
    checkIn: new Date(),
    checkOut: addDays(new Date(), 3),
  });
  const [guests, setGuests] = useState<number>(2);
  const [availableRooms, setAvailableRooms] = useState<Room[]>(hotelRooms);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const handleSearchRooms = (period: BookingPeriod, guestCount: number) => {
    setBookingPeriod(period);
    setGuests(guestCount);
    setHasSearched(true);
    
    const filteredRooms = hotelRooms.filter(room => room.capacity >= guestCount);
    setAvailableRooms(filteredRooms);
    
    setSelectedRooms([]);
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRooms(current => {
      const isSelected = current.some(r => r.id === room.id);
      
      if (isSelected) {
        return current.filter(r => r.id !== room.id);
      } else {
        return [...current, room];
      }
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
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HotelHeader />
      
      <div className="container mx-auto px-4 md:px-6 -mt-20 relative z-10 mb-12">
        <div className="flex justify-between items-center mb-6">
          <BookingForm 
            onSearch={handleSearchRooms} 
            className="mb-10"
          />
          
          {currentUser?.email === "amirahcolorado@gmail.com" && (
            <div className="flex gap-2">
              <InitializeAdmin />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          <div className="lg:col-span-2">
            {hasSearched ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-light">
                    Available Rooms
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({availableRooms.length} options)
                    </span>
                  </h2>
                </div>
                
                {availableRooms.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 animate-fade-in">
                    {availableRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onSelect={handleSelectRoom}
                        selectedRooms={selectedRooms}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-secondary/50 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">No rooms available</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or dates
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-light mb-3">Find Your Perfect Stay</h2>
                <p className="text-muted-foreground">
                  Search above to see available rooms for your dates
                </p>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <BookingSummary
                bookingPeriod={bookingPeriod}
                guests={guests}
                selectedRooms={selectedRooms}
                onBookNow={handleBookNow}
              />
              
              <div className="mt-6 p-6 bg-secondary/50 rounded-lg text-sm">
                <h3 className="font-medium mb-2">About Your Stay</h3>
                <Separator className="my-2" />
                <div className="space-y-1 mt-3 text-muted-foreground">
                  <p>• Check-in from 3:00 PM</p>
                  <p>• Check-out until 11:00 AM</p>
                  <p>• Free cancellation up to 48 hours before arrival</p>
                  <p>• Breakfast included with all bookings</p>
                  <p>• Free WiFi throughout the property</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        bookingDetails={bookingDetails}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default Hotel;
