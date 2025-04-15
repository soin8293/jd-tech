
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  rooms: {
    id: string;
    name: string;
    price: number;
  }[];
  period: {
    startDate: { seconds: number; nanoseconds: number };
    endDate: { seconds: number; nanoseconds: number };
  };
  guests: number;
  amount: number;
  status: string;
  createdAt: { seconds: number; nanoseconds: number };
}

const MyBookings = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const bookingsList: Booking[] = [];
        
        querySnapshot.forEach((doc) => {
          bookingsList.push({ id: doc.id, ...doc.data() } as Booking);
        });

        setBookings(bookingsList);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : bookings.length === 0 ? (
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
                    {getStatusBadge(booking.status)}
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
