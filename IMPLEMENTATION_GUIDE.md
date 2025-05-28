
# JD Suites Hotel Booking System - Complete Implementation Guide

## Overview
This is a comprehensive guide for building JD Suites, a hotel booking system with payment processing, room management, and user authentication. The system is built with React, TypeScript, Firebase, and Stripe.

## Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **Tanstack Query** for data fetching
- **Firebase SDK** for authentication and database
- **Stripe React** for payment processing

### Backend Stack
- **Firebase Functions** (Node.js/TypeScript)
- **Firestore** for database
- **Firebase Authentication**
- **Stripe API** for payment processing

## Core Features to Implement

### 1. Authentication System
- Google OAuth integration
- User profile management
- Admin role management
- Protected routes

### 2. Room Management
- CRUD operations for rooms
- Room availability tracking
- Image management
- Amenity management

### 3. Booking System
- Date range selection
- Guest count selection
- Room selection
- Availability checking
- Booking confirmation

### 4. Payment Processing
- Stripe integration
- Payment intent creation
- Booking processing
- Payment verification

### 5. Admin Features
- Room management interface
- Booking oversight
- Issue tracking
- User management

## Implementation Steps

## Step 1: Project Setup

### 1.1 Initialize React Project
```bash
npm create vite@latest jd-suites -- --template react-ts
cd jd-suites
npm install
```

### 1.2 Install Dependencies
```bash
# UI and Styling
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover
npm install @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
npm install lucide-react

# Data Fetching and State Management
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod

# Routing and Navigation
npm install react-router-dom

# Date Handling
npm install date-fns react-day-picker

# Firebase
npm install firebase

# Stripe
npm install @stripe/stripe-js @stripe/react-stripe-js

# Utilities
npm install uuid
```

### 1.3 Configure Tailwind CSS
Create `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## Step 2: Type Definitions

### 2.1 Create Core Types (`src/types/hotel.types.ts`)
```typescript
export interface Room {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  bed: string;
  amenities: string[];
  images: string[];
  availability: boolean;
  bookings?: BookingPeriod[];
}

export interface BookingPeriod {
  checkIn: Date;
  checkOut: Date;
  bookingReference?: string;
}

export interface BookingDetails {
  period: BookingPeriod;
  guests: number;
  rooms: Room[];
  totalPrice: number;
  userEmail?: string;
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

export interface RoomAvailabilityCheck {
  isAvailable: boolean;
  unavailableReason?: string;
  nextAvailableTime?: Date;
}
```

## Step 3: Firebase Configuration

### 3.1 Setup Firebase Project
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication with Google provider
3. Enable Firestore database
4. Enable Cloud Functions

### 3.2 Configure Firebase (`src/lib/firebase.ts`)
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  // Your Firebase config
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");

export default app;
```

### 3.3 Firestore Security Rules
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms - public read, admin write
    match /rooms/{roomId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Bookings - user access with booking token for guests
    match /bookings/{bookingId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                      resource.data.userId == request.auth.uid && 
                      resource.data.status == 'pending';
      allow delete: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Anonymous booking access via token
    match /bookings/{bookingId} {
      allow read: if resource.data.bookingToken == request.query.token && 
                   request.query.email == resource.data.userEmail;
    }
    
    // User profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Admin config
    match /config/admin {
      allow read: if request.auth != null;
      allow create: if request.auth != null && !exists(/databases/$(database)/documents/config/admin);
      allow update, delete: if false;
    }
  }
}
```

## Step 4: Authentication Context

### 4.1 Create Auth Context (`src/contexts/AuthContext.tsx`)
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

## Step 5: Room Service Layer

### 5.1 Room Queries (`src/services/room/roomQueries.ts`)
```typescript
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const getRooms = async (): Promise<Room[]> => {
  try {
    const roomsSnapshot = await getDocs(collection(db, ROOMS_COLLECTION));
    
    if (roomsSnapshot.empty) {
      // Return default rooms or empty array
      return [];
    }
    
    const rooms: Room[] = [];
    roomsSnapshot.forEach((doc) => {
      const data = doc.data();
      rooms.push({ 
        id: doc.id, 
        ...data,
        availability: data.availability !== false,
        bookings: data.bookings || []
      } as Room);
    });
    
    return rooms;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomDoc = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
    
    if (!roomDoc.exists()) {
      return null;
    }
    
    const data = roomDoc.data();
    return { 
      id: roomDoc.id, 
      ...data,
      availability: data.availability !== false,
      bookings: data.bookings || []
    } as Room;
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    throw error;
  }
};
```

### 5.2 Room Mutations (`src/services/room/roomMutations.ts`)
```typescript
import { doc, setDoc, deleteDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, BookingPeriod } from "@/types/hotel.types";

const ROOMS_COLLECTION = "rooms";

export const saveRoom = async (room: Room): Promise<void> => {
  try {
    if (!room.id) {
      throw new Error("Room ID is required");
    }
    
    const roomRef = doc(db, ROOMS_COLLECTION, room.id);
    await setDoc(roomRef, {
      name: room.name,
      description: room.description,
      price: room.price,
      capacity: room.capacity,
      size: room.size,
      bed: room.bed,
      amenities: room.amenities,
      images: room.images,
      availability: room.availability,
      bookings: room.bookings || []
    });
  } catch (error) {
    console.error("Error saving room:", error);
    throw error;
  }
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
  } catch (error) {
    console.error(`Error deleting room ${roomId}:`, error);
    throw error;
  }
};

export const addBookingToRoom = async (roomId: string, bookingPeriod: BookingPeriod): Promise<void> => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      bookings: arrayUnion({
        checkIn: bookingPeriod.checkIn,
        checkOut: bookingPeriod.checkOut
      })
    });
  } catch (error) {
    console.error(`Error adding booking to room ${roomId}:`, error);
    throw error;
  }
};
```

## Step 6: Payment Processing

### 6.1 Stripe Configuration
Create environment variables for Stripe:
- `STRIPE_PUBLIC_KEY` (frontend)
- `STRIPE_SECRET_KEY` (backend/functions)

### 6.2 Payment Types (`src/components/payment/payment.types.ts`)
```typescript
export type PaymentStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';
export type PaymentMethodType = 'card' | 'google_pay' | 'apple_pay' | 'bank_transfer';

export interface APIError {
  type: string;
  message: string;
  code?: string;
  param?: string;
}

export interface PaymentResponse {
  success: boolean;
  partial?: boolean;
  bookingId?: string;
  bookingToken?: string;
  paymentStatus?: string;
  message?: string;
  error?: APIError;
  clientSecret?: string;
  paymentIntentId?: string;
  calculatedAmount?: number;
}
```

### 6.3 Stripe Wrapper Component (`src/components/payment/StripeWrapper.tsx`)
```typescript
import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeWrapperProps {
  children: React.ReactNode;
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeWrapper;
```

## Step 7: Firebase Functions (Backend)

### 7.1 Initialize Functions
```bash
firebase init functions
cd functions
npm install stripe firebase-admin
```

### 7.2 Create Payment Intent Function (`functions/src/payment/createPaymentIntent.ts`)
```typescript
import * as functions from "firebase-functions";
import Stripe from "stripe";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
});

export const createPaymentIntent = functions.https.onCall(
  async (data, context) => {
    try {
      const { rooms, period, guests, transaction_id, currency = "usd" } = data;
      
      // Validate input
      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "No rooms provided for booking."
        );
      }

      if (!period || !period.checkIn || !period.checkOut) {
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Invalid booking period."
        );
      }

      // Calculate total amount
      const checkIn = new Date(period.checkIn);
      const checkOut = new Date(period.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (nights <= 0) {
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Check-in must be before check-out date."
        );
      }

      const totalAmount = rooms.reduce((sum: number, room: any) => {
        return sum + (room.price * nights);
      }, 0);

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency,
        metadata: {
          transaction_id: transaction_id || '',
          nights: nights.toString(),
          rooms: rooms.length.toString(),
          guests: (guests || 1).toString(),
          roomIds: rooms.map((room: any) => room.id).join(',')
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        calculatedAmount: totalAmount,
        details: {
          nights,
          roomCount: rooms.length
        }
      };
    } catch (error: any) {
      console.error('Error in createPaymentIntent:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create payment intent'
      );
    }
  }
);
```

### 7.3 Process Booking Function (`functions/src/payment/processBooking.ts`)
```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
});

export const processBooking = functions.https.onCall(
  async (data, context) => {
    try {
      const { paymentIntentId, bookingDetails, userEmail } = data;
      
      if (!paymentIntentId) {
        throw new functions.https.HttpsError(
          "invalid-argument", 
          "Payment Intent ID is required"
        );
      }
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new functions.https.HttpsError(
          "failed-precondition", 
          `Payment not completed. Status: ${paymentIntent.status}`
        );
      }
      
      // Generate booking ID
      const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Store booking in Firestore
      const bookingRecord = {
        id: bookingId,
        userId: context.auth?.uid || null,
        userEmail: userEmail || 'guest@example.com',
        rooms: bookingDetails.rooms,
        period: {
          startDate: admin.firestore.Timestamp.fromDate(new Date(bookingDetails.period.checkIn)),
          endDate: admin.firestore.Timestamp.fromDate(new Date(bookingDetails.period.checkOut))
        },
        guests: bookingDetails.guests,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentIntentId: paymentIntent.id,
        status: 'confirmed',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      await admin.firestore()
        .collection('bookings')
        .doc(bookingId)
        .set(bookingRecord);
      
      return {
        success: true,
        bookingId: bookingId,
        paymentStatus: paymentIntent.status,
        message: "Booking confirmed successfully!"
      };
      
    } catch (error: any) {
      console.error("Error processing booking:", error);
      
      return {
        success: false,
        error: {
          type: error.details?.type || 'unknown',
          message: error.message || "Failed to process booking"
        }
      };
    }
  }
);
```

## Step 8: UI Components

### 8.1 Hotel Header Component (`src/components/hotel/HotelHeader.tsx`)
```typescript
import React from "react";
import { Building2 } from "lucide-react";

const HotelHeader = () => {
  return (
    <div className="relative h-96 bg-gradient-to-r from-cyan-500 to-blue-500 overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="text-white">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-12 w-12" />
            <h1 className="text-5xl md:text-7xl font-extralight">JD Suites</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl">
            Experience luxury and comfort in our carefully curated selection of rooms and suites.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HotelHeader;
```

### 8.2 Booking Form Component (`src/components/hotel/BookingForm.tsx`)
```typescript
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { CalendarIcon, Users } from "lucide-react";
import { BookingPeriod } from "@/types/hotel.types";

interface BookingFormProps {
  onSearch: (period: BookingPeriod, guests: number) => void;
  className?: string;
  isLoading?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSearch, className, isLoading }) => {
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 3));
  const [guests, setGuests] = useState<number>(2);

  const handleSearch = () => {
    onSearch({ checkIn, checkOut }, guests);
  };

  return (
    <Card className={`p-6 bg-white/95 backdrop-blur-sm shadow-lg ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Check-in Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Check-in
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(checkIn, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={(date) => date && setCheckIn(date)}
                disabled={(date) => date < new Date()}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Check-out Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Check-out
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(checkOut, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={(date) => date && setCheckOut(date)}
                disabled={(date) => date <= checkIn}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full h-10 px-3 border border-input rounded-md"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>{num} Guest{num !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <Button 
            onClick={handleSearch} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search Rooms'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BookingForm;
```

### 8.3 Room Card Component (`src/components/hotel/RoomCard.tsx`)
```typescript
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Maximize, Bed, Check } from "lucide-react";
import { Room, BookingPeriod, RoomAvailabilityCheck } from "@/types/hotel.types";
import { differenceInDays } from "date-fns";

interface RoomCardProps {
  room: Room;
  isSelected?: boolean;
  onSelect?: (room: Room) => void;
  bookingPeriod?: BookingPeriod;
  availability?: RoomAvailabilityCheck;
  showSelectButton?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected = false,
  onSelect,
  bookingPeriod,
  availability,
  showSelectButton = true,
}) => {
  const nights = bookingPeriod ? 
    differenceInDays(bookingPeriod.checkOut, bookingPeriod.checkIn) : 1;
  const totalPrice = room.price * nights;

  const isAvailable = availability?.isAvailable !== false;

  return (
    <Card className={`h-full transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${!isAvailable ? 'opacity-60' : ''}`}>
      <div className="aspect-video overflow-hidden rounded-t-lg">
        <img
          src={room.images[0] || "/placeholder.svg"}
          alt={room.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{room.name}</CardTitle>
          <div className="text-right">
            <div className="text-xl font-bold">${room.price}</div>
            <div className="text-sm text-muted-foreground">per night</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <p className="text-muted-foreground mb-4 line-clamp-2">
          {room.description}
        </p>
        
        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{room.capacity} guests</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="h-4 w-4" />
            <span>{room.size} sqft</span>
          </div>
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{room.bed}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-1">
            {room.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {room.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{room.amenities.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        {bookingPeriod && (
          <div className="mb-4 p-3 bg-secondary/30 rounded-md">
            <div className="flex justify-between text-sm">
              <span>{nights} night{nights !== 1 ? 's' : ''}</span>
              <span className="font-medium">${totalPrice}</span>
            </div>
          </div>
        )}

        {!isAvailable && (
          <div className="mb-4 p-3 bg-destructive/10 rounded-md">
            <p className="text-destructive text-sm">
              {availability?.unavailableReason || "Not available for selected dates"}
            </p>
          </div>
        )}
        
        {showSelectButton && (
          <Button 
            className="mt-auto"
            onClick={() => onSelect?.(room)}
            disabled={!isAvailable}
            variant={isSelected ? "default" : "outline"}
          >
            {isSelected ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Selected
              </>
            ) : (
              "Select Room"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
```

## Step 9: Payment Modal Implementation

### 9.1 Payment Modal (`src/components/payment/PaymentModal.tsx`)
```typescript
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingDetails } from "@/types/hotel.types";
import { usePaymentProcess } from "@/hooks/payment";
import PaymentContent from "./PaymentContent";
import StripeWrapper from "./StripeWrapper";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: BookingDetails | null;
  onPaymentComplete: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingDetails,
  onPaymentComplete,
}) => {
  const {
    paymentStatus,
    errorDetails,
    transactionId,
    bookingId,
    bookingToken,
    processPayment,
    calculatedAmount,
  } = usePaymentProcess(isOpen, bookingDetails, onPaymentComplete);

  if (!bookingDetails) return null;

  const handlePayWithCard = async (paymentMethodId: string) => {
    await processPayment('card', paymentMethodId);
  };

  const handleGooglePay = async (paymentMethodId: string) => {
    await processPayment('google_pay', paymentMethodId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
        </DialogHeader>
        
        <StripeWrapper>
          <PaymentContent
            bookingDetails={bookingDetails}
            paymentStatus={paymentStatus}
            errorDetails={errorDetails}
            transactionId={transactionId}
            bookingId={bookingId}
            onCardPayment={handlePayWithCard}
            onGooglePayment={handleGooglePay}
            calculatedAmount={calculatedAmount}
          />
        </StripeWrapper>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
```

## Step 10: Main Application Routes

### 10.1 App Component (`src/App.tsx`)
```typescript
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Index from "@/pages/Index";
import Hotel from "@/pages/Hotel";
import MyBookings from "@/pages/MyBookings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hotel" element={<Hotel />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 10.2 Hotel Page (`src/pages/Hotel.tsx`)
```typescript
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { BookingPeriod, Room, BookingDetails } from "@/types/hotel.types";
import { useAuth } from "@/contexts/AuthContext";
import { getRooms, getAvailableRooms } from "@/services/room/roomService";
import { addDays, differenceInDays, format } from "date-fns";
import HotelHeader from "@/components/hotel/HotelHeader";
import BookingForm from "@/components/hotel/BookingForm";
import RoomList from "@/components/hotel/RoomList";
import PaymentModal from "@/components/payment/PaymentModal";

const Hotel = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>({
    checkIn: new Date(),
    checkOut: addDays(new Date(), 3),
  });
  const [guests, setGuests] = useState<number>(2);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchRooms = async (period: BookingPeriod, guestCount: number) => {
    setIsLoading(true);
    setBookingPeriod(period);
    setGuests(guestCount);
    setHasSearched(true);
    
    try {
      const roomsData = await getAvailableRooms(period.checkIn, period.checkOut);
      const filteredRooms = roomsData.filter(room => room.capacity >= guestCount);
      setAvailableRooms(filteredRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Error fetching rooms",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedRooms([]);
    }
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRooms(current => {
      const isSelected = current.some(r => r.id === room.id);
      return isSelected ? current.filter(r => r.id !== room.id) : [...current, room];
    });
  };

  const handleBookNow = () => {
    if (selectedRooms.length === 0) {
      toast({
        title: "No rooms selected",
        description: "Please select at least one room to continue.",
        variant: "destructive",
      });
      return;
    }
    
    const nights = differenceInDays(bookingPeriod.checkOut, bookingPeriod.checkIn);
    const totalPrice = selectedRooms.reduce((sum, room) => sum + (room.price * nights), 0);
    
    const details: BookingDetails = {
      period: bookingPeriod,
      guests,
      rooms: selectedRooms,
      totalPrice
    };
    
    if (currentUser?.email) {
      localStorage.setItem('userEmail', currentUser.email);
    }
    
    setBookingDetails(details);
    setPaymentModalOpen(true);
  };
  
  const handlePaymentComplete = () => {
    setPaymentModalOpen(false);
    
    toast({
      title: "Booking Confirmed!",
      description: `You have successfully booked ${selectedRooms.length} room(s).`,
    });
    
    setSelectedRooms([]);
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <HotelHeader />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 -mt-12">
        <BookingForm 
          onSearch={handleSearchRooms} 
          className="mb-10"
          isLoading={isLoading}
        />
        
        {hasSearched && (
          <RoomList 
            rooms={availableRooms}
            selectedRooms={selectedRooms}
            onSelectRoom={handleSelectRoom}
            bookingPeriod={bookingPeriod}
            onBookNow={handleBookNow}
            isLoading={isLoading}
          />
        )}

        {bookingDetails && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            bookingDetails={bookingDetails}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    </div>
  );
};

export default Hotel;
```

## Step 11: Environment Variables

### 11.1 Frontend Environment (`.env`)
```
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
```

### 11.2 Firebase Functions Environment
Set up Firebase function config:
```bash
firebase functions:config:set stripe.secret_key="sk_test_your_secret_key_here"
```

## Step 12: Deployment

### 12.1 Build and Deploy Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 12.2 Deploy Frontend
```bash
npm run build
# Deploy to your preferred hosting platform
```

## Logic Flow Summary

### Booking Process Flow:
1. **User selects dates and guests** → BookingForm component
2. **System searches available rooms** → Firebase Functions call to check availability
3. **User selects rooms** → State management in Hotel component
4. **User clicks Book Now** → PaymentModal opens
5. **Payment processing** → Stripe Payment Intent created via Firebase Function
6. **Payment confirmation** → Booking stored in Firestore
7. **Booking confirmation** → User receives confirmation

### Payment Flow:
1. **Create Payment Intent** → Firebase Function creates Stripe Payment Intent
2. **User enters payment details** → Stripe Elements handles card input
3. **Process payment** → Stripe processes payment
4. **Verify payment** → Firebase Function verifies payment success
5. **Store booking** → Booking data saved to Firestore
6. **Update room availability** → Room booking periods updated

### Authentication Flow:
1. **User signs in** → Google OAuth via Firebase Auth
2. **Context updates** → AuthContext provides user state globally
3. **Protected routes** → Components check authentication status
4. **Admin features** → Admin users get additional permissions

## Key Implementation Notes

1. **Error Handling**: Implement comprehensive error handling at every level
2. **Loading States**: Show loading indicators during async operations
3. **Validation**: Validate all user inputs before processing
4. **Security**: Use Firestore security rules and Firebase Auth
5. **Performance**: Implement caching and optimize queries
6. **Responsive Design**: Ensure mobile-friendly interface
7. **Accessibility**: Follow ARIA guidelines for screen readers
8. **Testing**: Write unit and integration tests for critical paths

## Testing Strategy

1. **Unit Tests**: Test individual components and utilities
2. **Integration Tests**: Test payment flow and booking process
3. **E2E Tests**: Test complete user journeys
4. **Performance Tests**: Test under load
5. **Security Tests**: Validate authentication and authorization

This implementation guide provides a complete foundation for building the JD Suites hotel booking system. Follow the steps in order, implementing each feature incrementally and testing thoroughly at each stage.
