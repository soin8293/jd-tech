
import React from "react";
import { CheckCircle, Copy, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingDetails } from "@/types/hotel.types";
import { useToast } from "@/components/ui/use-toast";

interface BookingConfirmationContentProps {
  bookingId: string;
  bookingDetails: BookingDetails;
  transactionId: string;
  bookingToken?: string;
}

const BookingConfirmationContent: React.FC<BookingConfirmationContentProps> = ({
  bookingId,
  bookingDetails,
  transactionId,
  bookingToken,
}) => {
  const { toast } = useToast();

  const handleCopyBookingInfo = () => {
    // Create a text summary of the booking
    const bookingSummary = `
Booking ID: ${bookingId}
Check-in: ${format(new Date(bookingDetails.period.checkIn), "MMM d, yyyy")}
Check-out: ${format(new Date(bookingDetails.period.checkOut), "MMM d, yyyy")}
Guest(s): ${bookingDetails.guests}
Room(s): ${bookingDetails.rooms.map(room => room.name).join(", ")}
Total Amount: $${bookingDetails.totalPrice.toFixed(2)}
Transaction ID: ${transactionId}
${bookingToken ? `Booking Token: ${bookingToken}` : ''}
    `.trim();

    navigator.clipboard.writeText(bookingSummary)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Booking details have been copied to your clipboard.",
        });
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast({
          title: "Failed to copy",
          description: "Could not copy booking details to clipboard.",
          variant: "destructive",
        });
      });
  };

  const checkInDate = format(new Date(bookingDetails.period.checkIn), "EEEE, MMMM d, yyyy");
  const checkOutDate = format(new Date(bookingDetails.period.checkOut), "EEEE, MMMM d, yyyy");
  
  // Calculate number of nights
  const nights = Math.ceil((new Date(bookingDetails.period.checkOut).getTime() - 
                            new Date(bookingDetails.period.checkIn).getTime()) / 
                            (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold">Booking Confirmed!</h2>
        <p className="text-muted-foreground mt-1">
          Your reservation has been successfully confirmed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-medium">{bookingId}</span>
            </div>
            {bookingToken && (
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Booking Token</span>
                <span className="font-medium">{bookingToken}</span>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Stay Information</h3>
            <div className="grid gap-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span>{checkInDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span>{checkOutDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{nights} night{nights !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span>{bookingDetails.guests}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Room Details</h3>
            <div className="space-y-2">
              {bookingDetails.rooms.map((room, index) => (
                <div key={index} className="flex justify-between">
                  <span>{room.name} ({room.bed})</span>
                  <span>${room.price.toFixed(2)}/night</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Payment Information</h3>
            <div className="grid gap-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold">${bookingDetails.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="text-xs">{transactionId}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleCopyBookingInfo}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Details
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </CardFooter>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        <p>A confirmation email has been sent to your email address.</p>
        <p className="mt-1">You can access your booking information using your Booking ID and Token.</p>
      </div>
    </div>
  );
};

export default BookingConfirmationContent;
