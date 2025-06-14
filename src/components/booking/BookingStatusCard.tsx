/**
 * Booking Status Card Component
 * Displays booking information and status in a clean card format
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  MapPin, 
  CreditCard, 
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react';
import { BookingDetails } from '@/types/hotel.types';
import { format } from 'date-fns';

interface BookingStatusCardProps {
  booking: BookingDetails & {
    id?: string;
    status?: 'confirmed' | 'pending' | 'cancelled';
    createdAt?: Date;
    totalAmount?: number;
  };
  onViewDetails?: () => void;
  onCancelBooking?: () => void;
  compact?: boolean;
}

const statusConfig = {
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    variant: 'default' as const,
    color: 'text-green-600'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    color: 'text-yellow-600'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'text-red-600'
  }
};

const BookingStatusCard: React.FC<BookingStatusCardProps> = ({
  booking,
  onViewDetails,
  onCancelBooking,
  compact = false
}) => {
  const status = booking.status || 'confirmed';
  const StatusIcon = statusConfig[status].icon;

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className={compact ? "pb-3" : "pb-4"}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig[status].color}`} />
            Booking #{booking.id?.slice(-8) || 'N/A'}
          </CardTitle>
          <Badge variant={statusConfig[status].variant}>
            {statusConfig[status].label}
          </Badge>
        </div>
        {booking.createdAt && (
          <p className="text-sm text-muted-foreground">
            Booked on {format(booking.createdAt, 'MMM dd, yyyy')}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Booking Period */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">
              {format(booking.period.checkIn, 'MMM dd, yyyy')}
            </span>
            <span className="mx-2 text-muted-foreground">to</span>
            <span className="font-medium">
              {format(booking.period.checkOut, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {/* Guests */}
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {booking.guests} Guest{booking.guests !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Rooms */}
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {booking.rooms.length} Room{booking.rooms.length !== 1 ? 's' : ''}
            {!compact && (
              <span className="text-muted-foreground ml-1">
                ({booking.rooms.map(r => r.name).join(', ')})
              </span>
            )}
          </span>
        </div>

        {/* Total Amount */}
        <div className="flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            ${booking.totalAmount || booking.totalPrice}
          </span>
        </div>

        {/* Action Buttons */}
        {!compact && (
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewDetails}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            )}
            {onCancelBooking && status === 'confirmed' && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onCancelBooking}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingStatusCard;