import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRequest, schemas } from "../utils/validation";
import { logger } from "../utils/logger";

const manageAdminRoleHandler = async (request: any) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to manage roles."
    );
  }
  
  if (!request.auth.token) {
    throw new HttpsError(
      "permission-denied",
      "Authentication token is missing or invalid."
    );
  }
  
  // Check admin permissions
  if (request.auth.token.admin !== true) {
    logger.warn("Permission denied for non-admin user", {
      uid: request.auth.uid,
      email: request.auth.token.email
    });
    
    throw new HttpsError(
      "permission-denied",
      "Caller must be an admin to manage roles."
    );
  }
  
  // Validate request data
  const validatedData = validateRequest(schemas.manageAdmin, request.data);
  const { email, makeAdmin } = validatedData;
  
  logger.setContext({ 
    targetEmail: email,
    action: makeAdmin ? 'grant' : 'revoke',
    callerUid: request.auth.uid 
  });
  
  logger.info("Managing admin role", { email, makeAdmin });
  
  // Initialize Firebase Admin if needed
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  
  try {
    // Get user by email
    logger.info("Retrieving user by email");
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    
    logger.setContext({ targetUid: uid });
    logger.info("User found, setting custom claims");
    
    // Set the custom claim
    await admin.auth().setCustomUserClaims(uid, { admin: makeAdmin });
    
    // Update Firestore admin list
    logger.info("Updating admin list in Firestore");
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    
    const docSnapshot = await adminConfigRef.get();
    
    if (docSnapshot.exists) {
      if (makeAdmin) {
        await adminConfigRef.update({
          adminEmails: admin.firestore.FieldValue.arrayUnion(email)
        });
      } else {
        await adminConfigRef.update({
          adminEmails: admin.firestore.FieldValue.arrayRemove(email)
        });
      }
    } else {
      await adminConfigRef.set({
        adminEmails: makeAdmin ? [email] : []
      });
    }
    
    logger.info("Admin role management completed successfully");
    
    return {
      success: true,
      message: `Successfully ${makeAdmin ? 'granted' : 'revoked'} admin role for ${email}.`,
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError(
        "not-found", 
        `User with email ${email} not found.`
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      throw new HttpsError(
        "invalid-argument", 
        `The email address ${email} is not valid.`
      );
    }
    
    logger.error("Failed to manage admin role", error);
    throw new HttpsError(
      "internal", 
      "An unexpected error occurred while managing admin role."
    );
  }
};

export const manageAdminRole = onCall(
  asyncHandler(manageAdminRoleHandler, 'manageAdminRole')
);