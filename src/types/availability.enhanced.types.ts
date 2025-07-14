import { BookingPeriod } from "@/types/hotel.types";

// Enhanced availability types for the new system
export interface DailyAvailabilityStatus {
  status: 'available' | 'booked' | 'blocked' | 'maintenance' | 'hold';
  bookingId?: string;
  guestEmail?: string;
  reason?: string;
  blockedBy?: string;
  blockedAt?: string; // ISO date string
  holdId?: string;
  holdExpires?: string; // ISO date string
}

export interface YearlyAvailabilityDocument {
  [dateKey: string]: DailyAvailabilityStatus; // Format: "MM-DD"
}

export interface AvailabilityUpdateRequest {
  roomId: string;
  dates: string[]; // Array of YYYY-MM-DD date strings
  status: 'blocked' | 'available' | 'maintenance';
  reason?: string;
}

export interface AvailabilityCalendarData {
  roomId: string;
  year: number;
  availability: YearlyAvailabilityDocument;
}

export interface CalendarViewOptions {
  view: 'month' | 'week' | 'year';
  selectedDate: Date;
  roomIds?: string[]; // For multi-room view
}

export interface AvailabilityConflict {
  date: string;
  currentStatus: DailyAvailabilityStatus;
  conflictType: 'booking_exists' | 'already_blocked' | 'hold_exists';
  message: string;
}

export interface BulkAvailabilityOperation {
  roomIds: string[];
  dateRange: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  operation: 'block' | 'unblock' | 'maintenance';
  reason?: string;
  template?: string; // For saving as template
}

export interface MaintenanceTemplate {
  id: string;
  name: string;
  description: string;
  duration: number; // Days
  reason: string;
  recurring?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number; // For weekly
    dayOfMonth?: number; // For monthly
  };
  createdBy: string;
  createdAt: string;
}

export interface AvailabilityStats {
  totalDays: number;
  availableDays: number;
  bookedDays: number;
  blockedDays: number;
  maintenanceDays: number;
  occupancyRate: number;
  blockedRate: number;
}

export interface CalendarEvent {
  id: string;
  roomId: string;
  title: string;
  start: Date;
  end: Date;
  type: 'booking' | 'blocked' | 'maintenance';
  status: DailyAvailabilityStatus;
  editable: boolean;
}