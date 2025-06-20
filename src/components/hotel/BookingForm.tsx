import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { BookingPeriod, Room } from "@/types/hotel.types";
import { checkRoomAvailability } from "@/services/booking/bookingQueries";
import RoomCard from "./RoomCard";

const BookingForm: React.FC = () => {
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState<number>(1);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { toast } = useToast();

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) {
      toast({
        title: "Missing Dates",
        description: "Please select both check-in and check-out dates.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Ensure we have valid dates for BookingPeriod
      const bookingPeriod: BookingPeriod = {
        checkIn: checkIn,
        checkOut: checkOut
      };

      const availableRooms = await checkRoomAvailability(bookingPeriod, guests);
      setAvailableRooms(availableRooms);
      setShowResults(true);
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to check room availability",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check Availability</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="check-in">Check In</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkIn && "text-muted-foreground"
                  )}
                >
                  {checkIn ? (
                    format(checkIn, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="check-out">Check Out</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkOut && "text-muted-foreground"
                  )}
                >
                  {checkOut ? (
                    format(checkOut, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) =>
                    date < (checkIn || new Date())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label htmlFor="guests">Guests</Label>
          <Input
            type="number"
            id="guests"
            min="1"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
          />
        </div>

        <Button onClick={checkAvailability} disabled={isSearching}>
          {isSearching ? "Searching..." : "Check Availability"}
        </Button>

        {showResults && (
          <div>
            {availableRooms.length > 0 ? (
              <div className="grid gap-4">
                {availableRooms.map((room) => (
                  <RoomCard key={room.id} room={room} checkIn={checkIn} checkOut={checkOut} guests={guests} />
                ))}
              </div>
            ) : (
              <p>No rooms available for the selected dates and number of guests.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingForm;
