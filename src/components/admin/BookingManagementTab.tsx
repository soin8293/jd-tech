import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookingList } from '@/components/admin/BookingList';
import { ManualBookingDialog } from '@/components/admin/ManualBookingDialog';
import { useRealTimeRooms } from '@/hooks/useRealTimeRooms';
import { useUserBookings } from '@/hooks/useUserBookings';
import { Room } from '@/types/hotel.types';

export const BookingManagementTab = () => {
  const { rooms } = useRealTimeRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [showManualBooking, setShowManualBooking] = useState(false);
  const { bookings, loading: isLoading } = useUserBookings();

  // Convert old booking format to new format
  const convertedBookings = bookings.map(booking => ({
    id: booking.id,
    roomId: booking.rooms?.[0]?.id || 'unknown',
    roomName: booking.rooms?.[0]?.name || 'Unknown Room',
    guestName: booking.userEmail?.split('@')[0] || 'Guest',
    guestEmail: booking.userEmail,
    checkInDate: booking.period?.startDate || booking.checkIn,
    checkOutDate: booking.period?.endDate || booking.checkOut,
    status: booking.status as any,
    totalAmount: booking.amount,
    createdAt: booking.createdAt
  }));

  // Filter bookings by selected room
  const filteredBookings = selectedRoomId === 'all' 
    ? convertedBookings 
    : convertedBookings.filter(booking => booking.roomId === selectedRoomId);

  // Calculate booking stats
  const totalBookings = filteredBookings.length;
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed').length;
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
  const checkedInBookings = filteredBookings.filter(b => b.status === 'checked-in').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Booking Management</h2>
          <p className="text-muted-foreground">View and manage all room bookings</p>
        </div>
        <Button 
          onClick={() => setShowManualBooking(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Manual Booking
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedBookings}</div>
            <p className="text-xs text-muted-foreground">
              Active bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{checkedInBookings}</div>
            <p className="text-xs text-muted-foreground">
              Currently staying
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cancelledBookings}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Room Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Room</CardTitle>
          <CardDescription>
            Select a specific room to view its bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id!}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Booking List */}
      <BookingList 
        bookings={filteredBookings}
        rooms={rooms}
        isLoading={isLoading}
      />

      {/* Manual Booking Dialog */}
      {showManualBooking && (
        <ManualBookingDialog
          isOpen={showManualBooking}
          onClose={() => setShowManualBooking(false)}
          rooms={rooms}
        />
      )}
    </div>
  );
};