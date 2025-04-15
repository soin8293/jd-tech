
import React from "react";
import { format } from "date-fns";
import { useUserBookings } from "@/hooks/useUserBookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const MyBookings = () => {
  const { bookings, loading, error } = useUserBookings();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Please Log In</h1>
        <p className="text-muted-foreground mb-8">You need to be logged in to view your bookings.</p>
        <Button onClick={() => navigate("/")}>Go to Homepage</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">You don't have any bookings yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const startDate = new Date(booking.period.startDate.seconds * 1000);
            const endDate = new Date(booking.period.endDate.seconds * 1000);
            const createdAt = new Date(booking.createdAt.seconds * 1000);
            
            return (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Booking #{booking.id.slice(-6)}</CardTitle>
                      <CardDescription>
                        Booked on {format(createdAt, "PPP")}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      booking.status === "completed" ? "default" :
                      booking.status === "pending" ? "secondary" :
                      "destructive"
                    }>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Dates</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(startDate, "PPP")} - {format(endDate, "PPP")}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Rooms</h3>
                      <ul className="text-sm text-muted-foreground">
                        {booking.rooms.map((room) => (
                          <li key={room.id} className="flex justify-between py-1">
                            <span>{room.name}</span>
                            <span>${room.price.toFixed(2)}/night</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-medium">
                      <span>Total Amount</span>
                      <span>${booking.amount.toFixed(2)}</span>
                    </div>
                  </div>
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
