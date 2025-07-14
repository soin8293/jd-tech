import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "../utils/logger";

export const deleteRoomSecure = onCall(async (request) => {
  // Verify admin authentication
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  const { roomId } = request.data;

  if (!roomId) {
    throw new HttpsError("invalid-argument", "Room ID is required");
  }

  const db = getFirestore();
  const storage = getStorage();
  const bucket = storage.bucket();

  try {
    await db.runTransaction(async (transaction) => {
      const roomRef = db.collection("rooms").doc(roomId);
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists) {
        throw new HttpsError("not-found", "Room not found");
      }

      // Check for active bookings
      const bookingsQuery = db.collection("bookings")
        .where("roomId", "==", roomId)
        .where("status", "in", ["confirmed", "checked-in"]);
      
      const activeBookings = await transaction.get(bookingsQuery);

      if (!activeBookings.empty) {
        throw new HttpsError("failed-precondition", 
          "Cannot delete room with active bookings. Cancel all bookings first.");
      }

      // Get room data for image cleanup
      const roomData = roomDoc.data();
      
      // Delete room images from storage
      if (roomData?.images && Array.isArray(roomData.images)) {
        for (const imageUrl of roomData.images) {
          try {
            const urlPath = new URL(imageUrl).pathname;
            const filePath = decodeURIComponent(urlPath.split('/o/')[1].split('?')[0]);
            
            const file = bucket.file(filePath);
            await file.delete();
            logger.info(`Deleted image: ${filePath}`);
          } catch (error) {
            logger.warn(`Failed to delete image ${imageUrl}:`, error);
          }
        }
      }

      // Delete availability subcollection documents
      const availabilityRef = roomRef.collection("availability");
      const availabilityDocs = await transaction.get(availabilityRef);
      
      availabilityDocs.forEach((doc) => {
        transaction.delete(doc.ref);
      });

      // Delete the room document
      transaction.delete(roomRef);
    });

    logger.info(`Room ${roomId} deleted successfully by ${request.auth.uid}`);
    
    return { 
      success: true, 
      message: "Room deleted successfully",
      roomId 
    };

  } catch (error) {
    logger.error("Failed to delete room:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Failed to delete room");
  }
});