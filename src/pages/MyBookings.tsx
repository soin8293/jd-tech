
import React from "react";
import { useUserBookings } from "@/hooks/useUserBookings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, Calendar, Users, DollarSign, MapPin } from "lucide-react";

const MyBookings = () => {
  const { bookings, loading, error } = useUserBookings();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-16 container mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-6">My Bookings</h1>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your bookings...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No bookings found.</p>
            <p className="text-sm text-muted-foreground mt-2">Your future reservations will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            // Helper function to convert Firebase timestamp or Date to Date object
            const convertToDate = (dateValue: any): Date => {
              if (!dateValue) return new Date();
              if (dateValue instanceof Date) return dateValue;
              if (typeof dateValue === 'object' && 'seconds' in dateValue) {
                return new Date(dateValue.seconds * 1000);
              }
              return new Date(dateValue);
            };

            // Handle different date formats - prioritize period fields, fallback to top-level
            const startDate = booking.period?.startDate 
              ? convertToDate(booking.period.startDate)
              : convertToDate(booking.checkIn);
            
            const endDate = booking.period?.endDate 
              ? convertToDate(booking.period.endDate)
              : convertToDate(booking.checkOut);

            // Calculate nights if not provided
            const nights = booking.numberOfNights || 
              Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Booking #{booking.id.slice(-6)}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold">${booking.amount}</div>
                      <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Rooms:</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.rooms.map(room => room.name).join(", ")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <span className="font-medium text-sm">Guests: </span>
                          <span className="text-sm">{booking.guests}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <span className="font-medium text-sm">Total Amount: </span>
                          <span className="text-sm">${booking.amount}</span>
                        </div>
                      </div>
                      
                      {nights && (
                        <div className="text-sm text-muted-foreground">
                          {nights} night{nights !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {booking.rooms.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Room Details:</p>
                      <div className="grid gap-2">
                        {booking.rooms.map((room, index) => (
                          <div key={index} className="text-sm bg-muted/50 p-2 rounded">
                            <span className="font-medium">{room.name}</span>
                            <span className="text-muted-foreground ml-2">${room.price}/night</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
