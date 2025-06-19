
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  // Add the missing properties
  checkIn: { seconds: number; nanoseconds: number } | Date;
  checkOut: { seconds: number; nanoseconds: number } | Date;
  numberOfNights: number;
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
      console.log("📋 BOOKINGS DEBUG: Starting fetchBookings");
      console.log("📋 BOOKINGS DEBUG: Current user:", currentUser);
      console.log("📋 BOOKINGS DEBUG: Current user UID:", currentUser?.uid);
      
      if (!currentUser) {
        console.log("📋 BOOKINGS DEBUG: No current user, skipping fetch");
        setLoading(false);
        return;
      }

      try {
        console.log("📋 BOOKINGS DEBUG: Creating bookings collection reference");
        const bookingsRef = collection(db, "bookings");
        console.log("📋 BOOKINGS DEBUG: Bookings collection reference:", bookingsRef);
        
        // Use a simpler query that only filters by userId (no orderBy to avoid composite index requirement)
        console.log("📋 BOOKINGS DEBUG: Creating query with userId filter only");
        const q = query(
          bookingsRef,
          where("userId", "==", currentUser.uid)
        );
        console.log("📋 BOOKINGS DEBUG: Query created:", q);
        console.log("📋 BOOKINGS DEBUG: Query filters - userId:", currentUser.uid);

        console.log("📋 BOOKINGS DEBUG: Executing query...");
        const querySnapshot = await getDocs(q);
        console.log("📋 BOOKINGS DEBUG: Query snapshot received:", querySnapshot);
        console.log("📋 BOOKINGS DEBUG: Query snapshot size:", querySnapshot.size);
        console.log("📋 BOOKINGS DEBUG: Query snapshot empty:", querySnapshot.empty);
        
        const bookingsList: Booking[] = [];
        
        console.log("📋 BOOKINGS DEBUG: Processing booking documents...");
        let docIndex = 0;
        querySnapshot.forEach((doc) => {
          docIndex++;
          console.log(`📋 BOOKINGS DEBUG: Processing booking ${docIndex}/${querySnapshot.size}`);
          console.log(`📋 BOOKINGS DEBUG: Booking document ID: ${doc.id}`);
          console.log(`📋 BOOKINGS DEBUG: Booking document data:`, doc.data());
          
          const bookingData = { id: doc.id, ...doc.data() } as Booking;
          console.log(`📋 BOOKINGS DEBUG: Processed booking:`, bookingData);
          bookingsList.push(bookingData);
        });

        // Sort by createdAt on the client side (most recent first)
        bookingsList.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        console.log("✅ BOOKINGS DEBUG: Successfully fetched and sorted bookings:", bookingsList);
        setBookings(bookingsList);
        setError(null);
      } catch (err) {
        console.error("❌ BOOKINGS ERROR: Error fetching bookings");
        console.error("❌ BOOKINGS ERROR: Error type:", typeof err);
        console.error("❌ BOOKINGS ERROR: Error constructor:", err?.constructor?.name);
        console.error("❌ BOOKINGS ERROR: Error message:", (err as any)?.message);
        console.error("❌ BOOKINGS ERROR: Error code:", (err as any)?.code);
        console.error("❌ BOOKINGS ERROR: Error details:", (err as any)?.details);
        console.error("❌ BOOKINGS ERROR: Full error object:", err);
        console.error("❌ BOOKINGS ERROR: Error stack:", (err as any)?.stack);
        setError("Unable to load your bookings. Please try again.");
      } finally {
        console.log("📋 BOOKINGS DEBUG: Setting loading to false");
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  return { bookings, loading, error };
};
