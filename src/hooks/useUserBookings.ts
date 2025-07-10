
import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  paymentIntentId: string;
  paymentType: string;
  period: {
    startDate: string;
    endDate: string;
  };
  checkIn: string;
  checkOut: string;
  numberOfNights: number;
  guests: number;
  rooms: any[];
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  bookingToken?: string;
}

interface BookingsResponse {
  success: boolean;
  bookings: Booking[];
  count: number;
}

export const useUserBookings = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserBookingsFunction = httpsCallable(functions, 'getUserBookings');

  const fetchBookings = async () => {
    if (!currentUser?.email) {
      console.log("No user email available, skipping bookings fetch");
      setBookings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching bookings for user:", currentUser.email);
      
      const result = await getUserBookingsFunction({
        userEmail: currentUser.email,
        userId: currentUser.uid
      });

      const response = result.data as BookingsResponse;
      
      if (response.success) {
        setBookings(response.bookings);
        console.log(`Successfully loaded ${response.count} bookings`);
      } else {
        throw new Error("Failed to fetch bookings");
      }
    } catch (error: any) {
      console.error("Error fetching user bookings:", error);
      setError(error.message || "Failed to load bookings");
      
      toast({
        title: "Error Loading Bookings",
        description: error.message || "Failed to load your booking history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch bookings when user changes
  useEffect(() => {
    if (currentUser?.email) {
      fetchBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [currentUser?.email]);

  const refreshBookings = () => {
    fetchBookings();
  };

  return {
    bookings,
    loading,
    error,
    refreshBookings,
    hasBookings: bookings.length > 0
  };
};
