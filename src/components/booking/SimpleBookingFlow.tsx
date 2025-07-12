import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Users, CreditCard, Loader2 } from "lucide-react";

interface SimpleBookingFlowProps {
  rooms: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  period: {
    checkIn: Date;
    checkOut: Date;
  };
  guests: number;
  totalPrice: number;
}

export const SimpleBookingFlow: React.FC<SimpleBookingFlowProps> = ({
  rooms,
  period,
  guests,
  totalPrice
}) => {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const functions = getFunctions();

  const handleBookNow = async () => {
    if (!guestName.trim() || !guestEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email address.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const bookingDetails = {
        rooms: rooms,
        period: {
          checkIn: period.checkIn.toISOString().split('T')[0],
          checkOut: period.checkOut.toISOString().split('T')[0],
        },
        guests,
        totalPrice,
        userEmail: guestEmail,
        guestName,
        specialRequests,
      };

      const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");
      const result = await createCheckoutSession({
        bookingDetails,
        successUrl: `${window.location.origin}/booking-success`,
        cancelUrl: `${window.location.origin}/booking-cancelled`,
      });

      const data = result.data as any;
      
      if (data.success && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }

    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to process booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    if (currentUser?.email) {
      setGuestEmail(currentUser.email);
    }
  }, [currentUser]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Your Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>
              {period.checkIn.toLocaleDateString()} - {period.checkOut.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span>{guests} guest{guests !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Rooms:</p>
            {rooms.map((room) => (
              <div key={room.id} className="flex justify-between text-sm">
                <span>{room.name}</span>
                <span>${room.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 flex justify-between font-medium">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Guest Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="guest-name">Full Name *</Label>
            <Input
              id="guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your full name"
              disabled={isProcessing}
            />
          </div>
          
          <div>
            <Label htmlFor="guest-email">Email Address *</Label>
            <Input
              id="guest-email"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isProcessing}
            />
          </div>

          <div>
            <Label htmlFor="special-requests">Special Requests</Label>
            <Textarea
              id="special-requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests or requirements..."
              disabled={isProcessing}
              rows={3}
            />
          </div>
        </div>

        {/* Book Now Button */}
        <Button 
          onClick={handleBookNow}
          disabled={isProcessing || !guestName.trim() || !guestEmail.trim()}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Book Now - ${totalPrice.toFixed(2)}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You will be redirected to Stripe to complete your payment securely.
        </p>
      </CardContent>
    </Card>
  );
};