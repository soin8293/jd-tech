import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStripeClient } from "../config/stripe";
import { logger } from "../utils/logger";

interface CheckInData {
  bookingId: string;
  roomId?: string;
  paymentMethod?: string; // "stripe" or "cash"
  cashAmount?: number; // For cash payments
}

const checkInBookingHandler = async (request: any) => {
  // Verify admin privileges
  const auth = getAuth();
  
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const user = await auth.getUser(request.auth.uid);
  const customClaims = user.customClaims;
  
  if (!customClaims?.admin) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const db = getFirestore();
  const { bookingId, roomId, paymentMethod, cashAmount } = request.data as CheckInData;

  logger.info("Starting check-in process", { bookingId, paymentMethod });

  // Validate inputs
  if (!bookingId) {
    throw new HttpsError("invalid-argument", "Booking ID is required.");
  }

  // Get booking
  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingDoc = await bookingRef.get();
  
  if (!bookingDoc.exists) {
    throw new HttpsError("not-found", "Booking not found.");
  }

  const bookingData = bookingDoc.data()!;
  logger.info("Retrieved booking data", { bookingId, status: bookingData.status });

  // Validate booking status and date
  if (!["confirmed", "pending"].includes(bookingData.status)) {
    throw new HttpsError("failed-precondition", "Booking must be confirmed or pending to check in.");
  }

  const today = new Date().toISOString().split("T")[0];
  if (bookingData.checkInDate > today) {
    throw new HttpsError("failed-precondition", "Check-in date is in the future.");
  }

  // Enhanced payment verification
  let paymentStatus = bookingData.paymentStatus || "pending";
  let paymentDetails: any = {};
  
  if (paymentMethod === "stripe" && bookingData.stripePaymentIntentId) {
    try {
      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(bookingData.stripePaymentIntentId, {
        expand: ['charges']
      });
      
      paymentStatus = paymentIntent.status;
      paymentDetails = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
        paymentMethod: paymentIntent.payment_method,
        lastPaymentError: paymentIntent.last_payment_error?.message || null
      };
      
      logger.info("Stripe payment verified", { 
        paymentIntentId: bookingData.stripePaymentIntentId, 
        status: paymentStatus,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });
      
      if (paymentStatus !== "succeeded") {
        const errorMessage = paymentIntent.last_payment_error?.message || `Payment not successful: ${paymentStatus}`;
        throw new HttpsError("failed-precondition", errorMessage);
      }
      
      // Verify amount matches booking
      const expectedAmount = Math.round(bookingData.totalCost * 100); // Convert to cents
      if (paymentIntent.amount !== expectedAmount) {
        logger.error("Payment amount mismatch", { 
          expected: expectedAmount, 
          actual: paymentIntent.amount 
        });
        throw new HttpsError("failed-precondition", "Payment amount does not match booking total");
      }
      
    } catch (stripeError: any) {
      logger.error("Stripe verification failed", { 
        error: stripeError.message,
        paymentIntentId: bookingData.stripePaymentIntentId 
      });
      
      if (stripeError instanceof HttpsError) {
        throw stripeError;
      }
      throw new HttpsError("internal", `Payment verification failed: ${stripeError.message}`);
    }
  } else if (paymentMethod === "cash") {
    if (cashAmount == null || cashAmount < bookingData.totalCost) {
      throw new HttpsError("invalid-argument", "Invalid or insufficient cash amount.");
    }
    paymentStatus = "cash_received";
    paymentDetails = {
      cashAmount,
      totalCost: bookingData.totalCost,
      change: cashAmount - bookingData.totalCost
    };
    logger.info("Cash payment recorded", { cashAmount, totalCost: bookingData.totalCost });
  } else {
    // No payment method specified, check if payment is already verified
    if (!bookingData.paymentStatus || bookingData.paymentStatus === "pending") {
      throw new HttpsError("failed-precondition", "Payment verification required for check-in");
    }
  }

  // Assign or confirm room
  let finalRoomId = bookingData.roomId;
  if (roomId && roomId !== bookingData.roomId) {
    // Check room availability
    const overlappingBookings = await db
      .collection("bookings")
      .where("roomId", "==", roomId)
      .where("status", "in", ["confirmed", "pending", "checked-in"])
      .where("checkInDate", "<=", bookingData.checkOutDate)
      .where("checkOutDate", ">=", bookingData.checkInDate)
      .get();

    if (!overlappingBookings.empty) {
      throw new HttpsError("failed-precondition", "Room is not available for the selected dates.");
    }
    finalRoomId = roomId;
  }

  if (!finalRoomId) {
    throw new HttpsError("failed-precondition", "Room assignment is required for check-in.");
  }

  // Update booking
  const updateData = {
    status: "checked-in",
    roomId: finalRoomId,
    paymentMethod: paymentMethod || bookingData.paymentMethod || "stripe",
    paymentStatus,
    checkInTimestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: user.uid,
  };

  await bookingRef.update(updateData);
  logger.info("Booking updated", { bookingId, status: "checked-in" });

  // Update room status
  await db.collection("rooms").doc(finalRoomId).update({ 
    status: "occupied",
    currentGuestId: bookingData.guestId,
    updatedAt: new Date().toISOString()
  });

  // Generate enhanced receipt with payment details
  const receiptData = {
    bookingId,
    guestId: bookingData.guestId,
    guestName: bookingData.guestName,
    guestEmail: bookingData.guestEmail,
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    roomId: finalRoomId,
    roomName: bookingData.roomName || `Room ${finalRoomId}`,
    totalCost: bookingData.totalCost,
    paymentMethod: updateData.paymentMethod,
    paymentStatus,
    paymentDetails,
    specialRequests: bookingData.specialRequests || "",
    cashAmount: paymentMethod === "cash" ? cashAmount : null,
    change: paymentMethod === "cash" ? (cashAmount - bookingData.totalCost) : null,
    receiptTimestamp: new Date().toISOString(),
    generatedBy: user.uid,
    generatedByName: user.email || "Admin",
    hotelName: "JD Suites",
    receiptNumber: `RCP-${Date.now()}`,
  };

  const receiptRef = await db.collection("receipts").add(receiptData);
  logger.info("Receipt generated", { receiptId: receiptRef.id });

  // Log the action
  await db.collection("auditLogs").add({
    bookingId,
    action: `Guest checked in: Room ${finalRoomId}, Payment: ${paymentMethod}, Status: checked-in`,
    adminId: user.uid,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Guest checked in successfully.",
    receiptId: receiptRef.id,
    receipt: receiptData,
  };
};

export const checkInBooking = onCall({
  cors: [
    "https://jd-suites-backend.web.app",
    "https://jd-suites-backend.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com"
  ]
}, checkInBookingHandler);