import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Calendar } from "lucide-react";

const BookingCancelled: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Booking Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your booking was cancelled and no payment was processed.
          </p>
          
          <p className="text-sm text-muted-foreground">
            You can try booking again or browse our available rooms.
          </p>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/booking')}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/hotel')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Browse Rooms
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingCancelled;