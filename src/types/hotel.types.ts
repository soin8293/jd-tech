
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
  version?: number; // For optimistic concurrency control
  updatedAt?: Date; // Timestamp for last update
  updatedBy?: string; // User ID who last updated this room
  updatedByEmail?: string; // Email of user who last updated this room
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

// Admin role hierarchy types
export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminUser {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  invitedBy?: string;
  invitedAt?: Date;
  activatedAt?: Date;
  lastLogin?: Date;
  status: 'invited' | 'active' | 'suspended';
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: AdminRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

export type AdminPermission = 
  | 'rooms.read' 
  | 'rooms.write' 
  | 'rooms.delete'
  | 'bookings.read' 
  | 'bookings.write' 
  | 'bookings.cancel'
  | 'admin.invite' 
  | 'admin.manage' 
  | 'admin.remove'
  | 'system.config'
  | 'system.backup';

export interface AdminConfig {
  superAdmins: string[]; // Hardcoded fallback emails
  adminUsers: AdminUser[];
  invitations: AdminInvitation[];
  settings: {
    requireEmailVerification: boolean;
    invitationExpiryHours: number;
    maxAdmins: number;
    allowSelfRegistration: boolean;
  };
}
