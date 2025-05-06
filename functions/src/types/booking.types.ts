
export interface Room {
  id?: string;
  name?: string; // Adding optional name property
  price: number;
}

export interface BookingPeriod {
  checkIn: string;
  checkOut: string;
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
