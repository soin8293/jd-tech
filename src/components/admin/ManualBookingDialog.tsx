import React, { useState } from 'react';
import { CalendarDays, User, Mail, Phone, CreditCard, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useBookingMutations } from '@/hooks/useBookingMutations';
import { Room } from '@/types/hotel.types';
import { useToast } from '@/hooks/use-toast';

interface ManualBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
}

interface BookingFormData {
  roomId: string;
  checkInDate: Date | undefined;
  checkOutDate: Date | undefined;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
  paymentStatus: 'pending' | 'paid' | 'invoice';
  totalAmount: string;
}

const initialFormData: BookingFormData = {
  roomId: '',
  checkInDate: undefined,
  checkOutDate: undefined,
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  specialRequests: '',
  paymentStatus: 'pending',
  totalAmount: ''
};

export const ManualBookingDialog: React.FC<ManualBookingDialogProps> = ({
  isOpen,
  onClose,
  rooms
}) => {
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const { createManualBooking, isLoading } = useBookingMutations();
  const { toast } = useToast();

  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoomChange = (roomId: string) => {
    const selectedRoom = rooms.find(room => room.id === roomId);
    setFormData(prev => ({
      ...prev,
      roomId,
      totalAmount: selectedRoom ? selectedRoom.price.toString() : ''
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.roomId || !formData.checkInDate || !formData.checkOutDate || 
        !formData.guestName || !formData.guestEmail) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.checkInDate >= formData.checkOutDate) {
      toast({
        title: "Validation Error",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    try {
      const bookingData = {
        roomId: formData.roomId,
        checkInDate: formData.checkInDate.toISOString().split('T')[0],
        checkOutDate: formData.checkOutDate.toISOString().split('T')[0],
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone || undefined,
        specialRequests: formData.specialRequests || undefined,
        paymentStatus: formData.paymentStatus,
        totalAmount: formData.totalAmount ? Number(formData.totalAmount) : undefined
      };

      await createManualBooking(bookingData);
      setFormData(initialFormData);
      onClose();
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  const selectedRoom = rooms.find(room => room.id === formData.roomId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Create Manual Booking
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="room">Room *</Label>
            <Select value={formData.roomId} onValueChange={handleRoomChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.filter(room => room.availability).map((room) => (
                  <SelectItem key={room.id} value={room.id!}>
                    {room.name} - ${room.price}/night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.checkInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {formData.checkInDate ? format(formData.checkInDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.checkInDate}
                    onSelect={(date) => handleInputChange('checkInDate', date)}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Check-out Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.checkOutDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {formData.checkOutDate ? format(formData.checkOutDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.checkOutDate}
                    onSelect={(date) => handleInputChange('checkOutDate', date)}
                    disabled={(date) => date <= (formData.checkInDate || new Date())}
                    className="pointer-events-auto"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Guest Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Full Name *</Label>
                <Input
                  id="guestName"
                  value={formData.guestName}
                  onChange={(e) => handleInputChange('guestName', e.target.value)}
                  placeholder="Enter guest's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={formData.guestEmail}
                  onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone Number</Label>
              <Input
                id="guestPhone"
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount ($)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  placeholder="0.00"
                />
                {selectedRoom && (
                  <p className="text-sm text-muted-foreground">
                    Room rate: ${selectedRoom.price}/night
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={formData.paymentStatus} 
                  onValueChange={(value: 'pending' | 'paid' | 'invoice') => 
                    handleInputChange('paymentStatus', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="invoice">Invoice Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              {isLoading ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};