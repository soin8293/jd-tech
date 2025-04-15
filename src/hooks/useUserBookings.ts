
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

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

export const useUserBookings = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(null);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  return { bookings, loading, error };
};
