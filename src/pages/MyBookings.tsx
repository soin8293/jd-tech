
import React from "react";
import { useUserBookings } from "@/hooks/useUserBookings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Loader2, Calendar, Users, DollarSign, MapPin, Building2 } from "lucide-react";

const MyBookings = () => {
  const { bookings, loading, error, errorType, refreshBookings } = useUserBookings();
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
            <div className="text-center">
              <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                {errorType === "network_error" ? (
                  <MapPin className="h-8 w-8 text-destructive" />
                ) : (
                  <Calendar className="h-8 w-8 text-destructive" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {errorType === "network_error" 
                  ? "Connection Problem" 
                  : errorType === "auth_error"
                  ? "Authentication Issue"
                  : "Unable to Load Bookings"
                }
              </h3>
              <p className="text-destructive text-base mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={refreshBookings} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Try Again
                </Button>
                {errorType === "network_error" && (
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                  >
                    Reload Page
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No bookings yet</h3>
            <p className="text-muted-foreground text-base mb-6 max-w-md mx-auto">
              You haven't made any reservations yet. Start planning your perfect getaway and book your first room with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/hotel" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Browse Rooms
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">
                  Go to Homepage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="text-sm text-muted-foreground mb-4">
            Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </div>
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

            const startDate = booking.period?.startDate 
              ? convertToDate(booking.period.startDate)
              : convertToDate(booking.checkIn);
            
            const endDate = booking.period?.endDate 
              ? convertToDate(booking.period.endDate)
              : convertToDate(booking.checkOut);

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
