import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

const setInitialAdminHandler = async (request: any) => {
  const targetEmail = "amirahcolorado@gmail.com";
  
  logger.setContext({ targetEmail });
  logger.info("Setting initial admin user");
  
  // Initialize Firebase Admin if needed
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  
  try {
    // Find the user by email
    logger.info("Retrieving user by email");
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    
    logger.setContext({ targetUid: userRecord.uid });
    logger.info("User found, setting admin claim");
    
    // Set admin claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Create or update the admin config document
    logger.info("Updating admin config in Firestore");
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    await adminConfigRef.set({
      adminEmails: [targetEmail]
    }, { merge: true });
    
    logger.info("Initial admin setup completed successfully");
    
    return {
      success: true,
      message: `Successfully set ${targetEmail} as the initial admin.`
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError(
        "not-found",
        `User with email ${targetEmail} not found. Please ensure this user has signed up first.`
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      throw new HttpsError(
        "invalid-argument",
        `The email address ${targetEmail} is not valid.`
      );
    }
    
    logger.error("Failed to set initial admin", error);
    throw new HttpsError(
      "internal", 
      "Failed to set initial admin user."
    );
  }
};

export const setInitialAdmin = onCall(
  asyncHandler(setInitialAdminHandler, 'setInitialAdmin')
);