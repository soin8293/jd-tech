import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, User, MapPin, CreditCard, Eye } from "lucide-react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckInForm } from "./CheckInForm";
import { useAuth } from "@/contexts/AuthContext";

interface Booking {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  roomId?: string;
  status: string;
  totalCost: number;
  paymentMethod?: string;
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  specialRequests?: string;
  checkInTimestamp?: string;
  updatedAt: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  status: string;
}

export const BookingManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch bookings in real-time
  useEffect(() => {
    if (!currentUser) return;

    const bookingsQuery = query(
      collection(db, "bookings"),
      orderBy("checkInDate", "desc")
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
      setBookings(bookingList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch available rooms
  useEffect(() => {
    if (!currentUser) return;

    const roomsQuery = query(collection(db, "rooms"));
    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const roomList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];
      setRooms(roomList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      "confirmed": "default",
      "pending": "secondary",
      "checked-in": "default",
      "checked-out": "secondary",
      "canceled": "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      succeeded: "default",
      cash_received: "default",
      pending: "secondary",
      failed: "destructive",
      declined: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === "succeeded" ? "Paid" : 
         status === "cash_received" ? "Cash" :
         status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canCheckIn = (booking: Booking) => {
    const today = new Date().toISOString().split("T")[0];
    return (
      ["confirmed", "pending"].includes(booking.status) &&
      booking.checkInDate <= today
    );
  };

  const getAvailableRooms = () => {
    return rooms.filter(room => room.status === "available");
  };

  const handleCheckInSuccess = () => {
    setShowCheckIn(false);
    setSelectedBooking(null);
  };

  const handleCheckInClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCheckIn(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p>Loading bookings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by guest name, email, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                <TabsTrigger value="checked-out">Checked Out</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found matching your criteria.
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{booking.guestName}</h3>
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {booking.guestEmail}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {booking.checkInDate} to {booking.checkOutDate}
                          </div>
                          {booking.roomId && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Room {booking.roomId}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            ${booking.totalCost}
                          </div>
                        </div>
                        
                        {booking.specialRequests && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> {booking.specialRequests}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Booking ID</label>
                                  <p className="font-mono text-sm">{booking.id}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <div className="mt-1">{getStatusBadge(booking.status)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Guest Name</label>
                                  <p>{booking.guestName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                                  <p>{booking.guestEmail}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Check-In Date</label>
                                  <p>{booking.checkInDate}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Check-Out Date</label>
                                  <p>{booking.checkOutDate}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Room</label>
                                  <p>{booking.roomId || "Not assigned"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                                  <p>${booking.totalCost}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                                  <p className="capitalize">{booking.paymentMethod || "Unknown"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                                  <div className="mt-1">{getPaymentStatusBadge(booking.paymentStatus)}</div>
                                </div>
                              </div>
                              {booking.specialRequests && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Special Requests</label>
                                  <p className="bg-muted p-2 rounded text-sm">{booking.specialRequests}</p>
                                </div>
                              )}
                              {booking.checkInTimestamp && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Checked In At</label>
                                  <p>{new Date(booking.checkInTimestamp).toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {canCheckIn(booking) && (
                          <Button 
                            onClick={() => handleCheckInClick(booking)}
                            size="sm"
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check-In Dialog */}
      <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guest Check-In</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <CheckInForm
              booking={selectedBooking}
              onSuccess={handleCheckInSuccess}
              availableRooms={getAvailableRooms()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};