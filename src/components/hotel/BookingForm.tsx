
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { BookingPeriod } from "@/types/hotel.types";
import { cn } from "@/lib/utils";
import { CalendarIcon, Users, Loader2 } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface BookingFormProps {
  className?: string;
  onSearch: (booking: BookingPeriod, guests: number) => void;
  isLoading?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({ className, onSearch, isLoading = false }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [guests, setGuests] = useState<number>(2);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: addDays(new Date(), 3)
  });
  
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    
    if (drawerOpen) {
      setDrawerOpen(false);
    }
  };

  const nights = dateRange.from && dateRange.to ? 
    differenceInDays(dateRange.to, dateRange.from) : 0;
    
  const DatePicker = () => (
    <div className="space-y-2 w-full">
      <label className="text-sm font-medium">Dates</label>
      {isMobile ? (
        <Button
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="w-full justify-start font-normal text-left h-12"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.from && dateRange.to ? (
            <div className="flex items-center w-full justify-between">
              <span className="truncate">
                {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
              </span>
              <span className="ml-1 text-muted-foreground text-sm bg-muted px-2 py-1 rounded-full flex-shrink-0">
                {nights} night{nights !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <span>Select dates</span>
          )}
        </Button>
      ) : (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start font-normal text-left h-12"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from && dateRange.to ? (
                <div className="flex items-center w-full justify-between">
                  <span className="truncate">
                    {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                  </span>
                  <span className="ml-1 text-muted-foreground text-sm bg-muted px-2 py-1 rounded-full flex-shrink-0">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                </div>
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
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );

  return (
    <>
      <Card className={cn(
        "animate-slide-up opacity-0 w-full shadow-lg", 
        isMobile ? "bg-white/95" : "",
        className
      )} style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <DatePicker />
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search Availability"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isMobile && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="px-4 pb-6 pt-2">
            <div className="mb-4">
              <h3 className="font-semibold text-lg text-center mb-4">Select Dates</h3>
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range as { from: Date; to: Date | undefined });
                }}
                disabled={{ before: new Date() }}
                className="pointer-events-auto mx-auto"
              />
            </div>
            <div className="flex justify-between px-4">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSearch}
                disabled={!dateRange.from || !dateRange.to}
              >
                Apply
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default BookingForm;
