import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStripeClient } from "../config/stripe";
import { logger } from "../utils/logger";

interface CreateCheckoutSessionData {
  bookingDetails: {
    rooms: Array<{
      id: string;
      name: string;
      price: number;
    }>;
    period: {
      checkIn: string;
      checkOut: string;
    };
    guests: number;
    totalPrice: number;
    userEmail?: string;
    specialRequests?: string;
  };
  successUrl?: string;
  cancelUrl?: string;
}

const createCheckoutSessionHandler = async (request: any) => {
  const db = getFirestore();
  const stripe = getStripeClient();
  
  const { bookingDetails, successUrl, cancelUrl } = request.data as CreateCheckoutSessionData;

  try {
    logger.info("Creating checkout session", { 
      totalPrice: bookingDetails.totalPrice,
      rooms: bookingDetails.rooms.length,
      userEmail: bookingDetails.userEmail 
    });

    // Create booking record first
    const bookingRef = await db.collection("bookings").add({
      guestEmail: bookingDetails.userEmail || "guest@example.com",
      guestName: "Guest", // This should come from user data or be captured
      rooms: bookingDetails.rooms,
      checkInDate: bookingDetails.period.checkIn,
      checkOutDate: bookingDetails.period.checkOut,
      guests: bookingDetails.guests,
      totalCost: bookingDetails.totalPrice,
      specialRequests: bookingDetails.specialRequests || "",
      status: "pending",
      paymentMethod: "stripe",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const bookingId = bookingRef.id;
    logger.info("Created booking record", { bookingId });

    // Create line items for Stripe
    const lineItems = bookingDetails.rooms.map(room => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: room.name,
          description: `Room booking from ${bookingDetails.period.checkIn} to ${bookingDetails.period.checkOut}`,
        },
        unit_amount: Math.round(room.price * 100), // Convert to cents
      },
      quantity: 1,
    }));

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${request.headers.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: cancelUrl || `${request.headers.origin}/booking-cancelled`,
      customer_email: bookingDetails.userEmail,
      metadata: {
        bookingId: bookingId,
        checkIn: bookingDetails.period.checkIn,
        checkOut: bookingDetails.period.checkOut,
        guests: bookingDetails.guests.toString(),
      },
    });

    // Update booking with session ID
    await bookingRef.update({
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      updatedAt: new Date().toISOString(),
    });

    logger.info("Checkout session created", { 
      sessionId: session.id, 
      bookingId,
      url: session.url 
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      bookingId: bookingId,
    };

  } catch (error: any) {
    logger.error("Failed to create checkout session", error);
    throw new HttpsError("internal", `Failed to create checkout session: ${error.message}`);
  }
};

export const createCheckoutSession = onCall({
  cors: [
    "https://jd-suites-backend.web.app",
    "https://jd-suites-backend.firebaseapp.com", 
    "http://localhost:3000",
    "http://localhost:5173",
    "https://c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com"
  ]
}, createCheckoutSessionHandler);