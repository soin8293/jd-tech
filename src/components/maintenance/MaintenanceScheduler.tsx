import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Lock,
  Unlock
} from "lucide-react";
import { useAvailabilityEngine } from "@/hooks/useAvailabilityEngine";
import { BlockedPeriod } from "@/types/availability.types";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays } from "date-fns";

interface MaintenanceSchedulerProps {
  roomId: string;
  className?: string;
}

export const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({
  roomId,
  className = ""
}) => {
  const { currentUser } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [reasonType, setReasonType] = useState<'maintenance' | 'renovation' | 'inspection' | 'custom'>('maintenance');
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);

  const {
    blockDates,
    isLoading,
    error,
    clearError
  } = useAvailabilityEngine();

  // Predefined maintenance reasons
  const maintenanceReasons = {
    maintenance: 'Routine Maintenance',
    renovation: 'Room Renovation',
    inspection: 'Safety Inspection',
    custom: 'Other'
  };

  // Handle form submission
  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!startDate || !endDate) {
      return;
    }

    if (!currentUser) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start >= end) {
      return;
    }

    const period: BlockedPeriod = {
      startDate: start,
      endDate: end,
      reason: reasonType === 'custom' ? reason : maintenanceReasons[reasonType],
      blockedBy: currentUser.email || currentUser.uid
    };

    const success = await blockDates(roomId, [period]);

    if (success) {
      // Add to local state for immediate UI update
      setBlockedPeriods(prev => [...prev, period]);
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setReasonType('maintenance');
    }
  };

  // Quick schedule buttons
  const quickSchedule = async (days: number, reasonText: string) => {
    if (!currentUser) return;

    const start = new Date();
    start.setDate(start.getDate() + 1); // Start tomorrow
    const end = addDays(start, days);

    const period: BlockedPeriod = {
      startDate: start,
      endDate: end,
      reason: reasonText,
      blockedBy: currentUser.email || currentUser.uid
    };

    const success = await blockDates(roomId, [period]);

    if (success) {
      setBlockedPeriods(prev => [...prev, period]);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  // Format date range for display
  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  };

  // Calculate duration in days
  const calculateDuration = (start: Date, end: Date) => {
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Maintenance Scheduler
          </CardTitle>
          <CardDescription>
            Block room dates for maintenance, renovations, and inspections
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Schedule Buttons */}
          <div>
            <h4 className="text-sm font-medium mb-3">Quick Schedule</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickSchedule(1, 'Deep Cleaning')}
                disabled={isLoading}
              >
                1 Day Clean
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickSchedule(3, 'Maintenance Check')}
                disabled={isLoading}
              >
                3 Day Service
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickSchedule(7, 'Room Renovation')}
                disabled={isLoading}
              >
                1 Week Reno
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickSchedule(14, 'Major Renovation')}
                disabled={isLoading}
              >
                2 Week Project
              </Button>
            </div>
          </div>

          {/* Custom Schedule Form */}
          <form onSubmit={handleScheduleMaintenance} className="space-y-4">
            <h4 className="text-sm font-medium">Custom Schedule</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDate()}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDate()}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Reason Type</label>
              <Select value={reasonType} onValueChange={(value: any) => setReasonType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Routine Maintenance</SelectItem>
                  <SelectItem value="renovation">Room Renovation</SelectItem>
                  <SelectItem value="inspection">Safety Inspection</SelectItem>
                  <SelectItem value="custom">Custom Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reasonType === 'custom' && (
              <div>
                <label className="text-sm font-medium">Custom Reason</label>
                <Textarea
                  placeholder="Enter the reason for blocking these dates..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Date Range Preview */}
            {startDate && endDate && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(new Date(startDate), new Date(endDate))}</span>
                  </div>
                  <Badge variant="secondary">
                    {calculateDuration(new Date(startDate), new Date(endDate))} days
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Room will be unavailable for booking during this period
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !startDate || !endDate}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </>
              )}
            </Button>
          </form>

          {/* Current Blocked Periods */}
          {blockedPeriods.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Recently Scheduled</h4>
              <div className="space-y-2">
                {blockedPeriods.slice(0, 5).map((period, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium">{period.reason}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateRange(period.startDate, period.endDate)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      {calculateDuration(period.startDate, period.endDate)} days
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Box */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Blocked dates cannot be booked by guests. 
              Make sure to coordinate with your housekeeping and maintenance teams 
              before scheduling. Existing bookings will not be affected.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};