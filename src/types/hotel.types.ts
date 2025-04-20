
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

export interface BookingPeriod {
  checkIn: Date;
  checkOut: Date;
}

export interface BookingDetails {
  period: BookingPeriod;
  guests: number;
  rooms: Room[];
  totalPrice: number;
  userEmail?: string; // Added this optional field for email storage
}

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

// Interface for room availability check
export interface RoomAvailabilityCheck {
  isAvailable: boolean;
  unavailableReason?: string;
  nextAvailableTime?: Date;
}
