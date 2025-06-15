import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

const setInitialAdminHandler = async (request: any) => {
  // Support both hardcoded and dynamic setup
  const targetEmail = request.data?.email || "amirahcolorado@gmail.com";
  const role = request.data?.role || "super_admin";
  
  logger.setContext({ targetEmail, role });
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
    
    // Set admin claims with role
    await admin.auth().setCustomUserClaims(userRecord.uid, { 
      admin: true, 
      role: role 
    });
    
    // Create or update the admin config document with full structure
    logger.info("Updating admin config in Firestore");
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    
    const adminConfigSnap = await adminConfigRef.get();
    let adminConfig: any;
    
    if (adminConfigSnap.exists) {
      adminConfig = adminConfigSnap.data();
    } else {
      adminConfig = {
        superAdmins: [targetEmail],
        adminUsers: [],
        invitations: [],
        settings: {
          requireEmailVerification: true,
          invitationExpiryHours: 72,
          maxAdmins: 50,
          allowSelfRegistration: false
        }
      };
    }
    
    // Ensure adminConfig is properly initialized
    if (!adminConfig) {
      throw new Error("Failed to initialize admin config");
    }
    
    // Add or update admin user
    const existingUserIndex = adminConfig.adminUsers.findIndex((u: any) => u.email === targetEmail);
    const adminUser = {
      email: targetEmail,
      role: role,
      permissions: [],
      activatedAt: new Date(),
      status: 'active'
    };
    
    if (existingUserIndex >= 0) {
      adminConfig.adminUsers[existingUserIndex] = adminUser;
    } else {
      adminConfig.adminUsers.push(adminUser);
    }
    
    // Update legacy adminEmails array for backward compatibility
    const allAdminEmails = adminConfig.adminUsers.map((u: any) => u.email);
    
    await adminConfigRef.set({
      ...adminConfig,
      adminEmails: allAdminEmails // Keep for compatibility
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