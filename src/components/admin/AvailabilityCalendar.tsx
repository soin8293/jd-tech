import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailabilityManagement } from '@/hooks/useAvailabilityManagement';
import { CalendarDays, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  roomId: string;
  roomName: string;
  onDateSelect?: (dates: Date[]) => void;
  selectedDates?: Date[];
  className?: string;
}

interface DayStatus {
  status: 'available' | 'booked' | 'blocked' | 'maintenance';
  reason?: string;
  bookingId?: string;
  guestEmail?: string;
  blockedBy?: string;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  roomId,
  roomName,
  onDateSelect,
  selectedDates = [],
  className
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<{ [date: string]: DayStatus }>({});
  const [loading, setLoading] = useState(false);
  const { getCalendar } = useAvailabilityManagement();

  const currentYear = currentDate.getFullYear();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch calendar data for current year
  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const data = await getCalendar({
          roomId,
          year: currentYear,
          includeBookings: true
        });
        setCalendarData(data.availability || {});
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchCalendarData();
    }
  }, [roomId, currentYear, getCalendar]);

  // Get status for a specific date
  const getDateStatus = (date: Date): DayStatus => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return calendarData[dateKey] || { status: 'available' };
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !onDateSelect) return;
    
    const isSelected = selectedDates.some(selected => 
      format(selected, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (isSelected) {
      const newSelected = selectedDates.filter(selected => 
        format(selected, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')
      );
      onDateSelect(newSelected);
    } else {
      onDateSelect([...selectedDates, date]);
    }
  };

  // Custom day renderer with status colors
  const dayModifiers = useMemo(() => {
    const modifiers: any = {
      available: [],
      booked: [],
      blocked: [],
      maintenance: [],
      selected: selectedDates
    };

    daysInMonth.forEach(date => {
      const status = getDateStatus(date);
      modifiers[status.status].push(date);
    });

    return modifiers;
  }, [daysInMonth, calendarData, selectedDates]);

  const dayModifiersStyles = {
    available: { 
      backgroundColor: 'var(--success)', 
      color: 'var(--success-foreground)' 
    },
    booked: { 
      backgroundColor: 'var(--destructive)', 
      color: 'var(--destructive-foreground)' 
    },
    blocked: { 
      backgroundColor: 'var(--warning)', 
      color: 'var(--warning-foreground)' 
    },
    maintenance: { 
      backgroundColor: 'var(--secondary)', 
      color: 'var(--secondary-foreground)' 
    },
    selected: { 
      backgroundColor: 'var(--primary)', 
      color: 'var(--primary-foreground)',
      fontWeight: 'bold' 
    }
  };

  // Stats for current month
  const monthStats = useMemo(() => {
    const stats = {
      total: daysInMonth.length,
      available: 0,
      booked: 0,
      blocked: 0,
      maintenance: 0
    };

    daysInMonth.forEach(date => {
      const status = getDateStatus(date);
      stats[status.status]++;
    });

    return stats;
  }, [daysInMonth, calendarData]);

  const occupancyRate = Math.round((monthStats.booked / monthStats.total) * 100);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {roomName} - Availability Calendar
            </CardTitle>
            <CardDescription>
              {format(currentDate, 'MMMM yyyy')} • Occupancy: {occupancyRate}%
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={currentDate.getFullYear().toString()}
              onValueChange={(year) => setCurrentDate(new Date(parseInt(year), currentDate.getMonth()))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-success/10 text-success">
            <div className="w-2 h-2 rounded-full bg-success mr-2" />
            Available ({monthStats.available})
          </Badge>
          <Badge variant="outline" className="bg-destructive/10 text-destructive">
            <div className="w-2 h-2 rounded-full bg-destructive mr-2" />
            Booked ({monthStats.booked})
          </Badge>
          <Badge variant="outline" className="bg-warning/10 text-warning">
            <div className="w-2 h-2 rounded-full bg-warning mr-2" />
            Blocked ({monthStats.blocked})
          </Badge>
          <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground">
            <div className="w-2 h-2 rounded-full bg-secondary mr-2" />
            Maintenance ({monthStats.maintenance})
          </Badge>
        </div>

        {/* Calendar */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Loading calendar...
              </div>
            </div>
          )}
          
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            month={currentDate}
            onMonthChange={setCurrentDate}
            modifiers={dayModifiers}
            modifiersStyles={dayModifiersStyles}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today; // Disable past dates
            }}
            className="rounded-md border pointer-events-auto"
          />
        </div>

        {/* Selected dates info */}
        {selectedDates.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedDates.map(date => format(date, 'MMM dd, yyyy')).join(', ')}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateSelect && onDateSelect([])}
            disabled={selectedDates.length === 0}
          >
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};