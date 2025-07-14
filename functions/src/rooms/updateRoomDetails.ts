import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "../utils/logger";

export const updateRoomDetails = onCall(async (request) => {
  // Verify admin authentication
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  const { roomId, roomData, imagesToDelete = [] } = request.data;

  if (!roomId || !roomData) {
    throw new HttpsError("invalid-argument", "Missing required parameters");
  }

  const db = getFirestore();
  const storage = getStorage();
  const bucket = storage.bucket();

  try {
    // Use transaction for data consistency
    await db.runTransaction(async (transaction) => {
      const roomRef = db.collection("rooms").doc(roomId);
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists) {
        throw new HttpsError("not-found", "Room not found");
      }

      // Delete images from storage if requested
      if (imagesToDelete.length > 0) {
        for (const imageUrl of imagesToDelete) {
          try {
            // Extract file path from URL
            const urlPath = new URL(imageUrl).pathname;
            const filePath = decodeURIComponent(urlPath.split('/o/')[1].split('?')[0]);
            
            const file = bucket.file(filePath);
            await file.delete();
            logger.info(`Deleted image: ${filePath}`);
          } catch (error) {
            logger.warn(`Failed to delete image ${imageUrl}:`, error);
          }
        }

        // Remove deleted images from roomData.images
        if (roomData.images) {
          roomData.images = roomData.images.filter((img: string) => !imagesToDelete.includes(img));
        }
      }

      // Update room data with timestamp
      const updateData = {
        ...roomData,
        updatedAt: new Date(),
        updatedBy: request.auth?.uid || "unknown"
      };

      transaction.update(roomRef, updateData);
    });

    logger.info(`Room ${roomId} updated successfully by ${request.auth.uid}`);
    
    return { 
      success: true, 
      message: "Room updated successfully",
      roomId 
    };

  } catch (error) {
    logger.error("Failed to update room:", error);
    throw new HttpsError("internal", "Failed to update room");
  }
});