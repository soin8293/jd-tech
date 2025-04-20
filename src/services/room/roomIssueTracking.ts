
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingNote, ChargeRecord } from "@/types/hotel.types";

const BOOKINGS_COLLECTION = "bookings";

/**
 * Adds a note to a booking for tracking issues or general information
 */
export const addNoteToBooking = async (
  bookingId: string, 
  noteContent: string, 
  createdBy: string,
  noteType: 'general' | 'issue' | 'payment' | 'damage' = 'general'
): Promise<void> => {
  try {
    if (!bookingId || !noteContent) {
      throw new Error("Booking ID and note content are required");
    }
    
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    const note: BookingNote = {
      content: noteContent,
      createdAt: new Date(),
      createdBy,
      type: noteType
    };
    
    await updateDoc(bookingRef, {
      notes: arrayUnion(note)
    });
    
    console.log(`Note added to booking ${bookingId}`);
  } catch (error) {
    console.error("Error adding note to booking:", error);
    throw error;
  }
};

/**
 * Adds a charge to a booking for damage or additional services
 */
export const addChargeToBooking = async (
  bookingId: string,
  amount: number,
  reason: string,
  chargedBy: string
): Promise<string> => {
  try {
    if (!bookingId || amount <= 0 || !reason) {
      throw new Error("Booking ID, positive amount, and reason are required");
    }
    
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    // In a real implementation, this would integrate with Stripe or another payment processor
    // to actually charge the card on file
    const transactionId = `charge-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const charge: ChargeRecord = {
      amount,
      date: new Date(),
      reason,
      status: 'pending', // Would be updated after actual payment processing
      transactionId
    };
    
    await updateDoc(bookingRef, {
      "paymentInfo.chargeHistory": arrayUnion(charge)
    });
    
    // Also add a note about the charge
    await addNoteToBooking(
      bookingId, 
      `Additional charge of $${amount} for ${reason}. Transaction ID: ${transactionId}`,
      chargedBy,
      'damage'
    );
    
    console.log(`Charge added to booking ${bookingId}`);
    return transactionId;
  } catch (error) {
    console.error("Error adding charge to booking:", error);
    throw error;
  }
};

/**
 * Gets all issues and charges related to a booking
 */
export const getBookingIssues = async (bookingId: string) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    const bookingData = bookingDoc.data();
    
    return {
      notes: (bookingData.notes || []).filter((note: BookingNote) => 
        note.type === 'issue' || note.type === 'damage'
      ),
      charges: bookingData.paymentInfo?.chargeHistory || []
    };
  } catch (error) {
    console.error("Error getting booking issues:", error);
    throw error;
  }
};
