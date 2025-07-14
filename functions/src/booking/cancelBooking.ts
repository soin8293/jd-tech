import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "../utils/logger";

export const cancelBooking = onCall(async (request) => {
  // Verify admin authentication
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  const { bookingId, reason = "Cancelled by admin" } = request.data;

  if (!bookingId) {
    throw new HttpsError("invalid-argument", "Booking ID is required");
  }

  const db = getFirestore();

  try {
    await db.runTransaction(async (transaction) => {
      const bookingRef = db.collection("bookings").doc(bookingId);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists) {
        throw new HttpsError("not-found", "Booking not found");
      }

      const bookingData = bookingDoc.data();
      
      if (!bookingData) {
        throw new HttpsError("internal", "Invalid booking data");
      }

      // Update booking status to cancelled
      transaction.update(bookingRef, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: request.auth.uid,
        cancellationReason: reason,
        updatedAt: new Date()
      });

      // Update availability calendar to mark dates as available again
      const checkInDate = new Date(bookingData.checkInDate);
      const checkOutDate = new Date(bookingData.checkOutDate);
      const roomId = bookingData.roomId;

      // Calculate all dates that need to be freed up
      const datesToUpdate: string[] = [];
      const currentDate = new Date(checkInDate);
      
      while (currentDate < checkOutDate) {
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        datesToUpdate.push(`${month}-${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Update availability for each year involved
      const years = new Set<number>();
      const tempDate = new Date(checkInDate);
      while (tempDate < checkOutDate) {
        years.add(tempDate.getFullYear());
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      for (const year of years) {
        const availabilityRef = db.collection("rooms")
          .doc(roomId)
          .collection("availability")
          .doc(year.toString());

        const availabilityDoc = await transaction.get(availabilityRef);
        const availabilityData = availabilityDoc.exists ? availabilityDoc.data() : {};

        // Update dates for this year
        datesToUpdate.forEach(dateKey => {
          const fullDate = new Date(`${year}-${dateKey}`);
          if (fullDate >= checkInDate && fullDate < checkOutDate) {
            if (availabilityData && availabilityData[dateKey]?.bookingId === bookingId) {
              availabilityData[dateKey] = { status: "available" };
            }
          }
        });

        if (availabilityDoc.exists) {
          transaction.update(availabilityRef, availabilityData);
        } else {
          transaction.set(availabilityRef, availabilityData);
        }
      }
    });

    logger.info(`Booking ${bookingId} cancelled successfully by ${request.auth.uid}`);
    
    return { 
      success: true, 
      message: "Booking cancelled successfully",
      bookingId 
    };

  } catch (error) {
    logger.error("Failed to cancel booking:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Failed to cancel booking");
  }
});