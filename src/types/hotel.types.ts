
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
}
