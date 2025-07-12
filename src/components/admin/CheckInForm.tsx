import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, DollarSign, User, MapPin, Receipt, CheckCircle } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";

interface CheckInFormProps {
  booking: any;
  onSuccess: () => void;
  availableRooms?: any[];
}

export const CheckInForm: React.FC<CheckInFormProps> = ({ booking, onSuccess, availableRooms = [] }) => {
  const [paymentMethod, setPaymentMethod] = useState<string>(booking.paymentMethod || "stripe");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(booking.roomId || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [error, setError] = useState("");
  
  const functions = getFunctions();
  const { toast } = useToast();

  const handleCompleteCheckIn = async () => {
    setError("");
    setIsCompleting(true);

    try {
      const checkInBooking = httpsCallable(functions, "checkInBooking");
      const result = await checkInBooking({
        bookingId: booking.id,
        roomId: selectedRoomId || booking.roomId,
        paymentMethod,
        cashAmount: paymentMethod === "cash" ? parseFloat(cashAmount) : undefined,
      });

      const data = result.data as any;
      if (data.success) {
        setReceipt(data.receipt);
        setShowReceipt(true);
        toast({
          title: "Check-in Successful",
          description: "Guest has been checked in successfully.",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete check-in");
      toast({
        title: "Check-in Failed",
        description: err.message || "Failed to complete check-in",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleConfirmCheckIn = () => {
    setShowReceipt(false);
    onSuccess();
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      succeeded: "default",
      cash_received: "default",
      pending: "secondary",
      failed: "destructive",
      declined: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === "succeeded" ? "Paid" : 
         status === "cash_received" ? "Cash Paid" :
         status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Check-In: {booking.guestName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Guest</Label>
              <p className="font-medium">{booking.guestName}</p>
              <p className="text-sm text-muted-foreground">{booking.guestEmail}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Booking ID</Label>
              <p className="font-mono text-sm">{booking.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Dates</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{booking.checkInDate} to {booking.checkOutDate}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Total Cost</Label>
              <p className="font-medium">${booking.totalCost}</p>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Payment Status</Label>
              {getPaymentStatusBadge(booking.paymentStatus || "pending")}
            </div>

            <div className="space-y-3">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Stripe Payment
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Cash Payment
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label htmlFor="cash-amount">Cash Amount Received</Label>
                <Input
                  id="cash-amount"
                  type="number"
                  step="0.01"
                  min={booking.totalCost}
                  placeholder={`Minimum: $${booking.totalCost}`}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
                {parseFloat(cashAmount) < booking.totalCost && cashAmount && (
                  <p className="text-sm text-destructive">
                    Amount must be at least ${booking.totalCost}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Room Assignment */}
          <div className="space-y-3">
            <Label htmlFor="room-assignment">Room Assignment</Label>
            {booking.roomId ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Room {booking.roomId}</span>
                {availableRooms.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedRoomId("")}
                  >
                    Change Room
                  </Button>
                )}
              </div>
            ) : null}
            
            {(!booking.roomId || selectedRoomId !== booking.roomId) && (
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.name || room.id} - {room.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Special Requests</Label>
              <p className="text-sm bg-muted p-2 rounded">{booking.specialRequests}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCompleteCheckIn}
              disabled={
                isCompleting ||
                (paymentMethod === "cash" && (!cashAmount || parseFloat(cashAmount) < booking.totalCost)) ||
                (!selectedRoomId && !booking.roomId)
              }
              className="flex-1"
            >
              {isCompleting ? (
                "Processing..."
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Complete Check-In
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Check-In Receipt
            </DialogTitle>
          </DialogHeader>
          
          {receipt && (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center py-4 border-b">
                <h3 className="font-bold text-lg">{receipt.hotelName}</h3>
                <p className="text-sm text-muted-foreground">Check-In Receipt</p>
                {receipt.receiptNumber && (
                  <p className="text-xs text-muted-foreground font-mono">{receipt.receiptNumber}</p>
                )}
              </div>
              
              {/* Guest & Booking Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Guest:</span>
                  <span className="font-medium">{receipt.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm">{receipt.guestEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Booking ID:</span>
                  <span className="font-mono text-sm">{receipt.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Room:</span>
                  <span className="font-medium">{receipt.roomName || receipt.roomId}</span>
                </div>
              </div>

              {/* Stay Details */}
              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Check-In:</span>
                  <span>{new Date(receipt.checkInDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Check-Out:</span>
                  <span>{new Date(receipt.checkOutDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Checked In:</span>
                  <span className="text-sm">{new Date(receipt.receiptTimestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Method:</span>
                  <span className="capitalize font-medium">{receipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Status:</span>
                  <span className="capitalize font-medium text-green-600">{receipt.paymentStatus}</span>
                </div>
                
                {/* Cash Payment Details */}
                {receipt.paymentMethod === "cash" && receipt.cashAmount && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cash Received:</span>
                      <span>${receipt.cashAmount.toFixed(2)}</span>
                    </div>
                    {receipt.change > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Change:</span>
                        <span>${receipt.change.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Stripe Payment Details */}
                {receipt.paymentMethod === "stripe" && receipt.paymentDetails && (
                  <div className="text-xs text-muted-foreground">
                    <p>Payment ID: {receipt.paymentDetails.paymentIntentId?.slice(-8)}</p>
                    <p>Currency: {receipt.paymentDetails.currency?.toUpperCase()}</p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t pt-3">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total Paid:</span>
                  <span>${receipt.totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Special Requests */}
              {receipt.specialRequests && (
                <div className="border-t pt-3">
                  <span className="text-sm text-muted-foreground">Special Requests:</span>
                  <p className="text-sm mt-1 bg-muted p-2 rounded">{receipt.specialRequests}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-3 text-center text-xs text-muted-foreground">
                <p>Thank you for staying with {receipt.hotelName}!</p>
                <p>Processed by: {receipt.generatedByName}</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1">
                  Preview Only
                </Button>
                <Button onClick={handleConfirmCheckIn} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Check-In
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};