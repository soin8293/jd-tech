
import React from "react";
import { useUserBookings } from "@/hooks/useUserBookings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

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
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle>Booking #{booking.id.slice(-6)}</CardTitle>
                <CardDescription>
                  {format(new Date(booking.period.startDate.seconds * 1000), "PPP")} -{" "}
                  {format(new Date(booking.period.endDate.seconds * 1000), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Rooms:</span>{" "}
                    {booking.rooms.map(room => room.name).join(", ")}
                  </p>
                  <p>
                    <span className="font-medium">Guests:</span> {booking.guests}
                  </p>
                  <p>
                    <span className="font-medium">Total Amount:</span> ${booking.amount}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span className="capitalize">{booking.status}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
