
export interface Room {
  id: string;
  name: string;
  price: number;
  capacity?: number;
  size?: number;
  bed?: string;
  amenities?: string[];
  images?: string[];
  availability?: boolean;
}

export interface BookingPeriod {
  checkIn: string | Date;
  checkOut: string | Date;
}

export interface CreatePaymentIntentData {
  rooms: Room[];
  period: BookingPeriod;
  guests: number;
  transaction_id?: string;
  booking_reference?: string;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string | null;
  paymentIntentId: string;
  calculatedAmount: number;
  details: {
    nights: number;
    roomCount: number;
  };
}
