
import React, { useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BookingPeriod, Room } from "@/types/hotel.types";
import { format, differenceInDays } from "date-fns";
import { CalendarDays, Users, CreditCard, Check } from "lucide-react";

interface BookingSummaryProps {
  bookingPeriod: BookingPeriod;
  guests: number;
  selectedRooms: Room[];
  onBookNow: () => void;
  className?: string;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  bookingPeriod,
  guests,
  selectedRooms,
  onBookNow,
  className,
}) => {
  const { toast } = useToast();
  
  const nights = useMemo(() => 
    differenceInDays(bookingPeriod.checkOut, bookingPeriod.checkIn),
    [bookingPeriod]
  );
  
  const totalPrice = useMemo(() => 
    selectedRooms.reduce((sum, room) => sum + (room.price * nights), 0),
    [selectedRooms, nights]
  );
  
  const handleBookNow = () => {
    if (selectedRooms.length === 0) {
      toast({
        title: "No rooms selected",
        description: "Please select at least one room to continue.",
        variant: "destructive",
      });
      return;
    }
    
    onBookNow();
  };

  const totalCapacity = useMemo(() =>
    selectedRooms.reduce((sum, room) => sum + room.capacity, 0),
    [selectedRooms]
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Booking Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-0">
        <div className="flex items-start space-x-3 pb-3">
          <CalendarDays className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</p>
            <p className="text-sm text-muted-foreground">
              {format(bookingPeriod.checkIn, "E, MMM d, yyyy")} to {" "}
              {format(bookingPeriod.checkOut, "E, MMM d, yyyy")}
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 pb-3">
          <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{guests} guest{guests !== 1 ? 's' : ''}</p>
            <p className="text-sm text-muted-foreground">
              {totalCapacity > 0 
                ? `Room capacity: ${totalCapacity} people`
                : "No rooms selected yet"}
            </p>
          </div>
        </div>
        
        {selectedRooms.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Selected Rooms:</h3>
            <ul className="space-y-2">
              {selectedRooms.map((room) => (
                <li key={room.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-1.5 text-primary" />
                    <span>{room.name}</span>
                  </div>
                  <span>${room.price} × {nights} = ${room.price * nights}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="border-t pt-4 pb-2">
          <div className="flex justify-between font-medium">
            <span>Total Price</span>
            <span>${totalPrice}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Includes taxes and fees
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Button 
          className="w-full h-12" 
          onClick={handleBookNow}
          disabled={selectedRooms.length === 0}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingSummary;
