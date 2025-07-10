import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { logger } from "../utils/logger";

interface GetUserBookingsRequest {
  userEmail?: string;
  userId?: string;
}

const getUserBookingsHandler = async (request: any) => {
  const { userEmail, userId } = request.data as GetUserBookingsRequest;
  
  logger.setContext({ 
    userEmail: userEmail || 'not provided',
    userId: userId || 'not provided'
  });
  
  logger.info("Retrieving user bookings", {
    userEmail,
    userId
  });

  try {
    const db = admin.firestore();
    let bookingsQuery;

    // Query bookings by userId if provided, otherwise by userEmail
    if (userId && userId !== 'guest') {
      bookingsQuery = db.collection('bookings')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');
    } else if (userEmail) {
      bookingsQuery = db.collection('bookings')
        .where('userEmail', '==', userEmail)
        .orderBy('createdAt', 'desc');
    } else {
      throw new HttpsError(
        'invalid-argument',
        'Either userId or userEmail must be provided'
      );
    }

    const querySnapshot = await bookingsQuery.get();
    
    const bookings = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for frontend
        createdAt: data.createdAt?.toDate()?.toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString(),
        period: {
          startDate: data.period?.startDate?.toDate()?.toISOString(),
          endDate: data.period?.endDate?.toDate()?.toISOString()
        }
      };
    });

    logger.info("User bookings retrieved successfully", {
      bookingCount: bookings.length
    });

    return {
      success: true,
      bookings,
      count: bookings.length
    };

  } catch (error: any) {
    logger.error("Error retrieving user bookings", error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      'internal',
      'Failed to retrieve bookings',
      {
        type: 'booking_retrieval_error',
        details: {
          message: error.message,
          code: error.code || 'unknown'
        }
      }
    );
  }
};

export const getUserBookings = onCall({
  cors: [
    "https://jd-suites-backend.web.app",
    "https://jd-suites-backend.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com"
  ]
}, getUserBookingsHandler);