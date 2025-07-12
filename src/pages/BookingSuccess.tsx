import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Receipt, Home, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BookingSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const bookingId = searchParams.get('booking_id');
    
    if (sessionId && bookingId) {
      // In a real app, you'd verify the payment and get booking details
      // For now, we'll show a success message
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed.",
      });

      // Mock booking details - in real app, fetch from backend
      setBookingDetails({
        id: bookingId,
        sessionId: sessionId,
        status: 'confirmed'
      });
    }
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Booking Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your payment has been processed successfully and your booking is confirmed.
          </p>
          
          {bookingDetails && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Booking ID:</p>
              <p className="font-mono text-lg">{bookingDetails.id}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address.
            </p>
            <p className="text-sm text-muted-foreground">
              You can view your booking details in "My Bookings".
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/my-bookings')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              My Bookings
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSuccess;