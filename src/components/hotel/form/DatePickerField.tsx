import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface DatePickerFieldProps {
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
  onSearch: () => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ 
  dateRange, 
  onDateChange, 
  onSearch 
}) => {
  const isMobile = useIsMobile();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nights = dateRange.from && dateRange.to ? 
    differenceInDays(dateRange.to, dateRange.from) : 0;

  const handleDateSelect = (range: any) => {
    onDateChange(range as DateRange);
    if (range?.to) {
      setCalendarOpen(false);
    }
  };

  const handleSearchFromDrawer = () => {
    onSearch();
    setDrawerOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <div className="space-y-2 w-full">
          <label className="text-sm font-medium">Dates</label>
          <Button
            variant="outline"
            onClick={() => setDrawerOpen(true)}
            className="w-full justify-start font-normal text-left h-12"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from && dateRange.to ? (
              <div className="flex items-center w-full justify-between overflow-hidden">
                <span className="truncate flex-grow">
                  {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                </span>
                <span className="ml-2 text-muted-foreground text-sm bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                  {nights} night{nights !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <span>Select dates</span>
            )}
          </Button>
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="px-4 pb-8 pt-2 max-h-[90vh] flex flex-col">
            <div className="flex-1 overflow-auto">
              <h3 className="font-semibold text-lg text-center mb-4">Select Dates</h3>
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={handleDateSelect}
                disabled={{ before: new Date() }}
                className="pointer-events-auto mx-auto"
              />
            </div>
            <div className="flex justify-between gap-4 mt-6 pb-safe">
              <Button 
                variant="outline" 
                onClick={() => setDrawerOpen(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSearchFromDrawer}
                disabled={!dateRange.from || !dateRange.to}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <label className="text-sm font-medium">Dates</label>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start font-normal text-left h-12"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from && dateRange.to ? (
              <div className="flex items-center w-full justify-between overflow-hidden">
                <span className="truncate flex-grow">
                  {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                </span>
                <span className="ml-2 text-muted-foreground text-sm bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
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
            onSelect={handleDateSelect}
            numberOfMonths={2}
            disabled={{ before: new Date() }}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerField;