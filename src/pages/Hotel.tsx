
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { BookingPeriod, Room } from "@/types/hotel.types";
import { hotelRooms } from "@/data/hotel.data";
import HotelHeader from "@/components/hotel/HotelHeader";
import BookingForm from "@/components/hotel/BookingForm";
import RoomCard from "@/components/hotel/RoomCard";
import BookingSummary from "@/components/hotel/BookingSummary";
import { Separator } from "@/components/ui/separator";
import { format, addDays } from "date-fns";

const Hotel = () => {
  const { toast } = useToast();
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>({
    checkIn: new Date(),
    checkOut: addDays(new Date(), 3),
  });
  const [guests, setGuests] = useState<number>(2);
  const [availableRooms, setAvailableRooms] = useState<Room[]>(hotelRooms);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchRooms = (period: BookingPeriod, guestCount: number) => {
    // In a real app, this would fetch from an API
    setBookingPeriod(period);
    setGuests(guestCount);
    setHasSearched(true);
    
    // Filter rooms by capacity (simulation)
    const filteredRooms = hotelRooms.filter(room => room.capacity >= guestCount);
    setAvailableRooms(filteredRooms);
    
    // Reset selection when search criteria change
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
    toast({
      title: "Booking Confirmed!",
      description: `You have successfully booked ${selectedRooms.length} room(s) from ${format(bookingPeriod.checkIn, "MMM d, yyyy")} to ${format(bookingPeriod.checkOut, "MMM d, yyyy")}.`,
    });
    
    // Reset the form
    setSelectedRooms([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HotelHeader />
      
      <div className="container mx-auto px-4 md:px-6 -mt-20 relative z-10 mb-12">
        <BookingForm 
          onSearch={handleSearchRooms} 
          className="mb-10"
        />
        
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
    </div>
  );
};

export default Hotel;
