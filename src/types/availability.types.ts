import { BookingPeriod, Room } from "@/types/hotel.types";

export interface AvailabilityResult {
  isAvailable: boolean;
  unavailableDates?: string[];
  conflictingBookings?: string[];
  reason?: string;
}

export interface BlockedPeriod {
  startDate: Date;
  endDate: Date;
  reason: string;
  blockedBy: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DayAvailability {
  status: 'available' | 'booked' | 'blocked';
  bookingId?: string;
  reason?: string;
  blockedBy?: string;
}

export interface ReservationHold {
  roomId: string;
  userId: string;
  dates: string[];
  expireAt: Date;
  createdAt: Date;
  paymentIntentId?: string;
}

export interface OccupancyData {
  rate: number;
  totalDays: number;
  bookedDays: number;
  revenue: number;
  averageDailyRate: number;
}

export interface AvailabilityEngine {
  checkAvailability(roomId: string, period: BookingPeriod): Promise<AvailabilityResult>;
  getNextAvailable(roomId: string, duration: number): Promise<Date | null>;
  blockDates(roomId: string, periods: BlockedPeriod[]): Promise<void>;
  getOccupancyRate(roomId: string, timeRange: DateRange): Promise<OccupancyData>;
  createReservationHold(roomId: string, period: BookingPeriod, userId: string): Promise<string>;
  releaseReservationHold(holdId: string): Promise<void>;
  processAtomicBooking(paymentIntentId: string, holdId: string): Promise<string>;
}