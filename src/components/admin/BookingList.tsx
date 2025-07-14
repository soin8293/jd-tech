import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, User, Mail, Phone, CreditCard, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBookingMutations } from '@/hooks/useBookingMutations';
import { Room } from '@/types/hotel.types';

interface Booking {
  id: string;
  roomId: string;
  roomName?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'confirmed' | 'cancelled' | 'checked-in' | 'checked-out';
  totalAmount?: number;
  paymentStatus?: string;
  createdAt: any;
  specialRequests?: string;
}

interface BookingListProps {
  bookings: Booking[];
  rooms: Room[];
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
    case 'checked-in': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'checked-out': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'invoice': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const BookingList: React.FC<BookingListProps> = ({ 
  bookings, 
  rooms, 
  isLoading 
}) => {
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const { cancelBooking, isLoading: isCancelling } = useBookingMutations();

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    try {
      await cancelBooking(bookingToCancel.id, "Cancelled by admin");
      setBookingToCancel(null);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.name || 'Unknown Room';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading bookings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No bookings found</p>
            <p className="text-sm">Bookings will appear here once guests make reservations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort bookings by check-in date (newest first)
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({bookings.length})</CardTitle>
          <CardDescription>
            Manage customer bookings and reservations
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {sortedBookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {booking.guestName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {booking.guestEmail}
                    </span>
                    {booking.guestPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {booking.guestPhone}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                  {booking.status === 'confirmed' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBookingToCancel(booking)}
                      className="flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Room</h4>
                  <p className="font-medium">{booking.roomName || getRoomName(booking.roomId)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Check-in</h4>
                  <p className="font-medium">
                    {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Check-out</h4>
                  <p className="font-medium">
                    {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Total Amount</h4>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">${booking.totalAmount || 0}</p>
                    {booking.paymentStatus && (
                      <Badge className={getPaymentStatusColor(booking.paymentStatus)} variant="outline">
                        {booking.paymentStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {booking.specialRequests && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Special Requests</h4>
                  <p className="text-sm">{booking.specialRequests}</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <p>Booking ID: {booking.id}</p>
                <p>Created: {format(new Date(booking.createdAt?.toDate?.() || booking.createdAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cancel Booking Confirmation Dialog */}
      <AlertDialog open={!!bookingToCancel} onOpenChange={() => setBookingToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking for <strong>{bookingToCancel?.guestName}</strong>? 
              This will make the room available for other guests and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};