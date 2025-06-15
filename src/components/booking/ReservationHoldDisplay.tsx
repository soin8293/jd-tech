import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  Lock,
  Unlock
} from "lucide-react";
import { useBookingConflictPrevention } from "@/hooks/useBookingConflictPrevention";
import { formatDistanceToNow } from "date-fns";

interface ReservationHoldDisplayProps {
  onExpiry?: () => void;
  onRelease?: () => void;
  className?: string;
}

export const ReservationHoldDisplay: React.FC<ReservationHoldDisplayProps> = ({
  onExpiry,
  onRelease,
  className = ""
}) => {
  const {
    holdState,
    isHoldActive,
    timeRemaining,
    formattedTimeRemaining,
    releaseHold
  } = useBookingConflictPrevention();

  // Calculate progress percentage (10 minutes = 600 seconds)
  const progressPercentage = isHoldActive ? ((600 - timeRemaining) / 600) * 100 : 0;

  // Handle expiry callback
  useEffect(() => {
    if (isHoldActive && timeRemaining === 0 && onExpiry) {
      onExpiry();
    }
  }, [isHoldActive, timeRemaining, onExpiry]);

  // Get status color and icon
  const getStatus = () => {
    if (!isHoldActive) {
      return {
        icon: <Unlock className="h-4 w-4 text-gray-500" />,
        text: "No Active Hold",
        variant: "secondary" as const,
        color: "text-gray-500"
      };
    }

    if (timeRemaining > 300) { // > 5 minutes
      return {
        icon: <Lock className="h-4 w-4 text-green-500" />,
        text: "Hold Active",
        variant: "default" as const,
        color: "text-green-500"
      };
    } else if (timeRemaining > 60) { // > 1 minute
      return {
        icon: <Timer className="h-4 w-4 text-yellow-500" />,
        text: "Expiring Soon",
        variant: "default" as const,
        color: "text-yellow-500"
      };
    } else {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        text: "Expiring Now",
        variant: "destructive" as const,
        color: "text-red-500"
      };
    }
  };

  const status = getStatus();

  const handleRelease = async () => {
    await releaseHold();
    if (onRelease) {
      onRelease();
    }
  };

  if (!isHoldActive) {
    return (
      <Alert className={className}>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Room availability is protected by our double-booking prevention system.
          Create a reservation to secure your booking.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`${className} border-2 ${timeRemaining <= 60 ? 'border-red-200 animate-pulse' : 'border-blue-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {status.icon}
            Reservation Hold
          </CardTitle>
          <Badge variant={status.variant}>
            {status.text}
          </Badge>
        </div>
        <CardDescription>
          Your room is temporarily reserved
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Countdown Timer */}
        <div className="text-center">
          <div className={`text-2xl font-mono font-bold ${status.color}`}>
            {formattedTimeRemaining}
          </div>
          <div className="text-xs text-muted-foreground">
            Time remaining to complete booking
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Reserved</span>
            <span>Expires</span>
          </div>
        </div>

        {/* Hold Details */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Hold ID:</span>
            <span className="font-mono">{holdState.holdId?.slice(0, 8)}...</span>
          </div>
          {holdState.expiresAt && (
            <div className="flex justify-between">
              <span>Expires:</span>
              <span>{formatDistanceToNow(holdState.expiresAt, { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Warning for low time */}
        {timeRemaining <= 120 && ( // 2 minutes or less
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your reservation will expire in {Math.floor(timeRemaining / 60)} minute(s). 
              Complete your booking soon to avoid losing this room.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRelease}
          className="w-full"
        >
          Release Hold
        </Button>

        {/* Protection Notice */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-xs">
              <div className="font-medium">Double-Booking Protection</div>
              <div className="text-muted-foreground">
                This room is temporarily locked from other bookings while you complete your reservation.
                If you don't complete within 10 minutes, it will automatically become available again.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};