
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingPeriod } from "@/types/hotel.types";
import { cn } from "@/lib/utils";
import { CalendarIcon, Users } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";

interface BookingFormProps {
  className?: string;
  onSearch: (booking: BookingPeriod, guests: number) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ className, onSearch }) => {
  const { toast } = useToast();
  const [guests, setGuests] = useState<number>(2);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: addDays(new Date(), 3)
  });
  
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSearch = () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Please select dates",
        description: "You need to select both check-in and check-out dates",
        variant: "destructive"
      });
      return;
    }
    
    onSearch(
      { 
        checkIn: dateRange.from, 
        checkOut: dateRange.to 
      },
      guests
    );
    
    toast({
      title: "Searching for rooms",
      description: `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")} for ${guests} guests`,
    });
  };

  const nights = dateRange.from && dateRange.to ? 
    differenceInDays(dateRange.to, dateRange.from) : 0;

  return (
    <Card className={cn("animate-slide-up opacity-0", className)} style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dates</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal text-left h-12"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                      <span className="ml-auto text-muted-foreground text-sm bg-muted px-2 py-1 rounded-full">
                        {nights} night{nights !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <span>Select dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range as { from: Date; to: Date | undefined });
                    if (range.to) {
                      setCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Guests</label>
            <Select
              value={guests.toString()}
              onValueChange={(value) => setGuests(parseInt(value))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select guests">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    {guests} Guest{guests !== 1 ? 's' : ''}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Guest{num !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium opacity-0">Search</label>
            <Button 
              onClick={handleSearch} 
              className="h-12 transition-all hover:shadow-md"
            >
              Search Availability
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
