
import React from "react";
import { BookingDetails } from "@/types/hotel.types";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface BookingSummaryProps {
  bookingDetails: BookingDetails;
  serverCalculatedAmount?: number | null;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ 
  bookingDetails,
  serverCalculatedAmount
}) => {
  // Calculate number of nights
  const checkIn = new Date(bookingDetails.period.checkIn);
  const checkOut = new Date(bookingDetails.period.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-secondary/30 p-4 rounded-md">
      <h3 className="text-sm font-medium mb-2">Booking Summary</h3>
      <div className="text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Check-in:</span>
          <span>{format(bookingDetails.period.checkIn, "MMM d, yyyy")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Check-out:</span>
          <span>{format(bookingDetails.period.checkOut, "MMM d, yyyy")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nights:</span>
          <span>{nights}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Guests:</span>
          <span>{bookingDetails.guests}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rooms:</span>
          <span>{bookingDetails.rooms.length}</span>
        </div>
        
        {bookingDetails.rooms.map((room, index) => (
          <div key={room.id || index} className="flex justify-between text-xs px-2">
            <span className="text-muted-foreground truncate max-w-[60%]">{room.name}</span>
            <span>${room.price}/night</span>
          </div>
        ))}
        
        <Separator className="my-2" />
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>${serverCalculatedAmount !== null && serverCalculatedAmount !== undefined ? 
            serverCalculatedAmount : bookingDetails.totalPrice}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
