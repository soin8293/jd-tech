
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { BookingPeriod } from "@/types/hotel.types";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import DatePickerField from "@/components/hotel/form/DatePickerField";
import GuestSelector from "@/components/hotel/form/GuestSelector";
import SearchButton from "@/components/hotel/form/SearchButton";

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

  return (
    <Card className={cn(
      "animate-slide-up opacity-0 w-full shadow-lg", 
      isMobile ? "bg-white/95" : "",
      className
    )} style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DatePickerField 
            dateRange={dateRange}
            onDateChange={setDateRange}
            onSearch={handleSearch}
          />

          <GuestSelector 
            guests={guests}
            onGuestsChange={setGuests}
          />

          <SearchButton 
            onClick={handleSearch}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
