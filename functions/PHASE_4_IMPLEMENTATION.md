# Firebase Cloud Functions Implementation Guide

## Required Cloud Functions for Phase 4: Booking Integration & Availability

This document outlines the Cloud Functions that need to be deployed to implement the advanced availability system with double-booking prevention.

### Prerequisites

1. Enable Cloud Functions in your Firebase project
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Initialize functions: `firebase init functions`
4. Enable BigQuery for advanced analytics (optional)

### Data Model Setup

#### 1. Firestore Collections Structure

```
rooms/{roomId}/availability/{year}
reservation_holds/{holdId}
bookings/{bookingId}
```

#### 2. TTL Policy for Reservation Holds

Set up TTL policy in Google Cloud Console:
- Collection: `reservation_holds`
- TTL field: `expireAt`
- Duration: 10 minutes

### Cloud Functions Implementation

#### 1. checkAvailability

```typescript
exports.checkAvailability = functions.https.onCall(async (data, context) => {
  const { roomId, startDate, endDate } = data;
  
  // Validate authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const year = start.getFullYear();
    
    // Get availability document
    const availabilityRef = admin.firestore()
      .doc(`rooms/${roomId}/availability/${year}`);
    const availabilityDoc = await availabilityRef.get();
    
    if (!availabilityDoc.exists) {
      return { isAvailable: true };
    }
    
    const availability = availabilityDoc.data();
    const unavailableDates = [];
    
    // Check each date in range
    const current = new Date(start);
    while (current < end) {
      const dateKey = formatDateKey(current);
      if (availability[dateKey] && availability[dateKey] !== 'available') {
        unavailableDates.push(dateKey);
      }
      current.setDate(current.getDate() + 1);
    }
    
    // Check reservation holds
    const holdsQuery = admin.firestore()
      .collection('reservation_holds')
      .where('roomId', '==', roomId)
      .where('expireAt', '>', new Date());
    
    const holdsSnapshot = await holdsQuery.get();
    const holdDates = [];
    
    holdsSnapshot.forEach(doc => {
      const hold = doc.data();
      holdDates.push(...hold.dates);
    });
    
    // Check for conflicts with holds
    const current2 = new Date(start);
    while (current2 < end) {
      const dateKey = formatDateKey(current2);
      if (holdDates.includes(dateKey)) {
        unavailableDates.push(dateKey);
      }
      current2.setDate(current2.getDate() + 1);
    }
    
    return {
      isAvailable: unavailableDates.length === 0,
      unavailableDates
    };
    
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to check availability');
  }
});
```

#### 2. createReservationHold

```typescript
exports.createReservationHold = functions.https.onCall(async (data, context) => {
  const { roomId, userId, startDate, endDate } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Generate date keys
    const dates = [];
    const current = new Date(start);
    while (current < end) {
      dates.push(formatDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    
    // Create hold document
    const holdRef = admin.firestore().collection('reservation_holds').doc();
    
    await holdRef.set({
      roomId,
      userId,
      dates,
      expireAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { holdId: holdRef.id };
    
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to create reservation hold');
  }
});
```

#### 3. processAtomicBooking

```typescript
exports.processAtomicBooking = functions.https.onCall(async (data, context) => {
  const { paymentIntentId, holdId } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      // Get reservation hold
      const holdRef = admin.firestore().doc(`reservation_holds/${holdId}`);
      const holdDoc = await transaction.get(holdRef);
      
      if (!holdDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Reservation hold not found');
      }
      
      const hold = holdDoc.data();
      
      // Check if hold is still valid
      if (hold.expireAt.toDate() < new Date()) {
        throw new functions.https.HttpsError('failed-precondition', 'Reservation hold has expired');
      }
      
      // Get availability document
      const year = new Date().getFullYear();
      const availabilityRef = admin.firestore()
        .doc(`rooms/${hold.roomId}/availability/${year}`);
      const availabilityDoc = await transaction.get(availabilityRef);
      
      // Check availability one final time
      const availability = availabilityDoc.exists ? availabilityDoc.data() : {};
      
      for (const dateKey of hold.dates) {
        if (availability[dateKey] && availability[dateKey] !== 'available') {
          throw new functions.https.HttpsError('failed-precondition', 
            'Room is no longer available for selected dates');
        }
      }
      
      // Create booking
      const bookingRef = admin.firestore().collection('bookings').doc();
      const bookingData = {
        id: bookingRef.id,
        roomId: hold.roomId,
        userId: hold.userId,
        paymentIntentId,
        dates: hold.dates,
        status: 'confirmed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      transaction.set(bookingRef, bookingData);
      
      // Update availability
      const updates = {};
      hold.dates.forEach(dateKey => {
        updates[dateKey] = {
          status: 'booked',
          bookingId: bookingRef.id
        };
      });
      
      if (availabilityDoc.exists) {
        transaction.update(availabilityRef, updates);
      } else {
        transaction.set(availabilityRef, updates);
      }
      
      // Delete reservation hold
      transaction.delete(holdRef);
      
      return { bookingId: bookingRef.id };
    });
    
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to process booking');
  }
});
```

#### 4. getOccupancyRate

```typescript
exports.getOccupancyRate = functions.https.onCall(async (data, context) => {
  const { roomId, startDate, endDate } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const year = start.getFullYear();
    
    // Get availability data
    const availabilityRef = admin.firestore()
      .doc(`rooms/${roomId}/availability/${year}`);
    const availabilityDoc = await availabilityRef.get();
    
    if (!availabilityDoc.exists) {
      return {
        rate: 0,
        totalDays: 0,
        bookedDays: 0,
        revenue: 0,
        averageDailyRate: 0
      };
    }
    
    const availability = availabilityDoc.data();
    let totalDays = 0;
    let bookedDays = 0;
    
    // Count days
    const current = new Date(start);
    while (current < end) {
      totalDays++;
      const dateKey = formatDateKey(current);
      if (availability[dateKey]?.status === 'booked') {
        bookedDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    // Get revenue data from bookings
    const bookingsQuery = admin.firestore()
      .collection('bookings')
      .where('roomId', '==', roomId);
    
    const bookingsSnapshot = await bookingsQuery.get();
    let totalRevenue = 0;
    let revenueBookings = 0;
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      if (booking.amount) {
        totalRevenue += booking.amount;
        revenueBookings++;
      }
    });
    
    const rate = totalDays > 0 ? (bookedDays / totalDays) * 100 : 0;
    const averageDailyRate = revenueBookings > 0 ? totalRevenue / revenueBookings : 0;
    
    return {
      rate,
      totalDays,
      bookedDays,
      revenue: totalRevenue,
      averageDailyRate
    };
    
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to get occupancy rate');
  }
});
```

#### 5. Utility Functions

```typescript
function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}
```

### Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms and availability (read-only for users)
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
      
      match /availability/{year} {
        allow read: if request.auth != null;
        allow write: if false; // Only Cloud Functions can write
      }
    }
    
    // Reservation holds (user can only access their own)
    match /reservation_holds/{holdId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Bookings (user can only access their own)
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

### Deployment Instructions

1. **Deploy Cloud Functions:**
   ```bash
   firebase deploy --only functions
   ```

2. **Set up TTL Policy:**
   - Go to Google Cloud Console > Firestore
   - Navigate to TTL Policies
   - Create policy for `reservation_holds` collection with `expireAt` field

3. **Enable BigQuery (Optional):**
   - Install the "Stream Collections to BigQuery" extension
   - Configure for the `bookings` collection

4. **Test the Implementation:**
   - Use the provided React hooks to test each function
   - Verify double-booking prevention by testing concurrent bookings
   - Check TTL policy by creating holds and waiting for expiration

This implementation provides a production-ready booking system with atomic transactions, double-booking prevention, and real-time availability tracking.