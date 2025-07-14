import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "../utils/logger";

interface ManualBookingData {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  paymentStatus?: "pending" | "paid" | "invoice";
  totalAmount?: number;
}

export const createManualBooking = onCall(async (request) => {
  // Verify admin authentication
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  const bookingData: ManualBookingData = request.data;

  if (!bookingData.roomId || !bookingData.checkInDate || !bookingData.checkOutDate || 
      !bookingData.guestName || !bookingData.guestEmail) {
    throw new HttpsError("invalid-argument", "Missing required booking information");
  }

  const db = getFirestore();

  try {
    const result = await db.runTransaction(async (transaction) => {
      // Validate dates
      const checkIn = new Date(bookingData.checkInDate);
      const checkOut = new Date(bookingData.checkOutDate);
      
      if (checkIn >= checkOut) {
        throw new HttpsError("invalid-argument", "Check-out date must be after check-in date");
      }

      if (checkIn < new Date()) {
        throw new HttpsError("invalid-argument", "Check-in date cannot be in the past");
      }

      // Check room exists
      const roomRef = db.collection("rooms").doc(bookingData.roomId);
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists) {
        throw new HttpsError("not-found", "Room not found");
      }

      const roomData = roomDoc.data();

      // Check availability for all dates
      const datesToBook: string[] = [];
      const currentDate = new Date(checkIn);
      
      while (currentDate < checkOut) {
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        datesToBook.push(`${month}-${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Check availability for each year involved
      const years = new Set<number>();
      const tempDate = new Date(checkIn);
      while (tempDate < checkOut) {
        years.add(tempDate.getFullYear());
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      for (const year of years) {
        const availabilityRef = db.collection("rooms")
          .doc(bookingData.roomId)
          .collection("availability")
          .doc(year.toString());

        const availabilityDoc = await transaction.get(availabilityRef);
        const availabilityData = availabilityDoc.exists ? availabilityDoc.data() : {};

        // Check if any dates are already booked
        for (const dateKey of datesToBook) {
          const fullDate = new Date(`${year}-${dateKey}`);
          if (fullDate >= checkIn && fullDate < checkOut) {
            const dateStatus = availabilityData?.[dateKey];
            if (dateStatus && dateStatus.status !== "available") {
              throw new HttpsError("failed-precondition", 
                `Date ${dateKey} is not available (status: ${dateStatus.status})`);
            }
          }
        }
      }

      // Create booking document
      const bookingRef = db.collection("bookings").doc();
      const bookingId = bookingRef.id;

      const newBooking = {
        id: bookingId,
        roomId: bookingData.roomId,
        roomName: roomData?.name || "Unknown Room",
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone || "",
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        specialRequests: bookingData.specialRequests || "",
        totalAmount: bookingData.totalAmount || roomData?.price || 0,
        paymentStatus: bookingData.paymentStatus || "pending",
        status: "confirmed",
        bookingSource: "admin",
        createdAt: new Date(),
        createdBy: request.auth?.uid || "unknown",
        updatedAt: new Date()
      };

      transaction.set(bookingRef, newBooking);

      // Update availability calendar
      for (const year of years) {
        const availabilityRef = db.collection("rooms")
          .doc(bookingData.roomId)
          .collection("availability")
          .doc(year.toString());

        const availabilityDoc = await transaction.get(availabilityRef);
        const availabilityData = availabilityDoc.exists ? availabilityDoc.data() : {};

        // Mark dates as booked
        datesToBook.forEach(dateKey => {
          const fullDate = new Date(`${year}-${dateKey}`);
          if (fullDate >= checkIn && fullDate < checkOut) {
            availabilityData[dateKey] = {
              status: "booked",
              bookingId: bookingId,
              guestEmail: bookingData.guestEmail,
              guestName: bookingData.guestName
            };
          }
        });

        if (availabilityDoc.exists) {
          transaction.update(availabilityRef, availabilityData || {});
        } else {
          transaction.set(availabilityRef, availabilityData || {});
        }
      }

      return { bookingId, booking: newBooking };
    });

    logger.info(`Manual booking ${result.bookingId} created successfully by ${request.auth.uid}`);
    
    return { 
      success: true, 
      message: "Booking created successfully",
      bookingId: result.bookingId,
      booking: result.booking
    };

  } catch (error) {
    logger.error("Failed to create manual booking:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Failed to create booking");
  }
});