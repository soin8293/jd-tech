
import React from "react";
import { BookingDetails } from "@/types/hotel.types";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface BookingSummaryProps {
  bookingDetails: BookingDetails;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ bookingDetails }) => {
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
          <span className="text-muted-foreground">Guests:</span>
          <span>{bookingDetails.guests}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rooms:</span>
          <span>{bookingDetails.rooms.length}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>${bookingDetails.totalPrice}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
