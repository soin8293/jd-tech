
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
  isEmpty?: boolean;
  message?: string;
  error?: string;
  errorType?: string;
  details?: {
    originalError: string;
    code: string;
    timestamp: string;
  };
}

export const useUserBookings = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  const getUserBookingsFunction = httpsCallable(functions, 'getUserBookings');

  const fetchBookings = async () => {
    if (!currentUser?.email) {
      console.log("No user email available, skipping bookings fetch");
      setBookings([]);
      setError(null);
      setErrorType(null);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      console.log("Fetching bookings for user:", currentUser.email);
      
      const result = await getUserBookingsFunction({
        userEmail: currentUser.email,
        userId: currentUser.uid
      });

      const response = result.data as BookingsResponse;
      console.log("Backend response:", response);
      
      if (response.success) {
        setBookings(response.bookings);
        console.log(`Successfully loaded ${response.count} bookings`);
        
        if (response.isEmpty) {
          console.log("User has no bookings yet - this is normal for new users");
        }
      } else {
        // Handle backend errors with specific error types
        const errorMessage = response.error || "Failed to fetch bookings";
        const errorTypeValue = response.errorType || "unknown";
        
        console.error("Backend returned error:", {
          error: errorMessage,
          errorType: errorTypeValue,
          details: response.details
        });
        
        setError(errorMessage);
        setErrorType(errorTypeValue);
        
        // Only show toast for actual errors, not for "no bookings"
        if (errorTypeValue !== 'no_bookings') {
          toast({
            title: getErrorTitle(errorTypeValue),
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Network/function call error:", error);
      
      // Determine error type based on error characteristics
      let errorTypeValue = "network_error";
      let errorMessage = "Failed to load bookings";
      
      if (error.message?.includes("Failed to fetch") || error.message?.includes("Network")) {
        errorTypeValue = "network_error";
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes("Unauthorized") || error.message?.includes("auth")) {
        errorTypeValue = "auth_error";
        errorMessage = "Authentication failed. Please try logging in again.";
      } else if (error.message?.includes("timeout")) {
        errorTypeValue = "timeout_error";
        errorMessage = "Request timed out. Please try again.";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }
      
      setError(errorMessage);
      setErrorType(errorTypeValue);
      
      toast({
        title: getErrorTitle(errorTypeValue),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorTitle = (errorType: string): string => {
    switch (errorType) {
      case "network_error":
        return "Connection Error";
      case "auth_error":
        return "Authentication Error";
      case "timeout_error":
        return "Request Timeout";
      case "validation_error":
        return "Invalid Request";
      default:
        return "Error Loading Bookings";
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
    errorType,
    refreshBookings,
    hasBookings: bookings.length > 0
  };
};
