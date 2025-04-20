
export interface Room {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number; // in sqft
  bed: string;
  amenities: string[];
  images: string[];
  availability: boolean;
  bookings?: BookingPeriod[]; // New field to track booked periods
}

// Adding RoomFormData type for form handling
export interface RoomFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  bed: string;
  amenities: string[];
  images: string[];
  availability: boolean;
}

export interface BookingPeriod {
  checkIn: Date;
  checkOut: Date;
  bookingReference?: string; // Reference to the booking document
}

export interface BookingDetails {
  period: BookingPeriod;
  guests: number;
  rooms: Room[];
  totalPrice: number;
  userEmail?: string; // Added this optional field for email storage
  contactPhone?: string;
  specialRequests?: string;
  paymentInfo?: PaymentInfo;
  status?: BookingStatus;
  notes?: BookingNote[];
}

export interface PaymentInfo {
  transactionId: string;
  paymentMethod: string;
  lastFourDigits?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  chargeHistory?: ChargeRecord[];
}

export interface ChargeRecord {
  amount: number;
  date: Date;
  reason: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
}

export interface BookingNote {
  content: string;
  createdAt: Date;
  createdBy: string;
  type?: 'general' | 'issue' | 'payment' | 'damage';
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

// Interface for room availability check
export interface RoomAvailabilityCheck {
  isAvailable: boolean;
  unavailableReason?: string;
  nextAvailableTime?: Date;
}
