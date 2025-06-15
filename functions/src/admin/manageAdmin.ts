import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRequest, schemas } from "../utils/validation";
import { logger } from "../utils/logger";
import { AdminConfig, AdminRole, canManageRole } from "../types/admin.types";

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
  
  // Check admin permissions with role hierarchy
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
  const { email, makeAdmin, role = 'admin' } = validatedData;
  
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
    // Get admin config to check role hierarchy
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    const adminConfigSnap = await adminConfigRef.get();
    
    let adminConfig: AdminConfig = {
      superAdmins: ["amirahcolorado@gmail.com"], // Hardcoded fallback
      adminUsers: [],
      invitations: [],
      settings: {
        requireEmailVerification: true,
        invitationExpiryHours: 72,
        maxAdmins: 50,
        allowSelfRegistration: false
      }
    };
    
    if (adminConfigSnap.exists()) {
      adminConfig = { ...adminConfig, ...adminConfigSnap.data() };
    }
    
    // Check caller's role and permissions
    const callerEmail = request.auth.token.email;
    const callerAdminUser = adminConfig.adminUsers.find(u => u.email === callerEmail);
    const isHardcodedSuperAdmin = adminConfig.superAdmins.includes(callerEmail);
    const callerRole = callerAdminUser?.role || (isHardcodedSuperAdmin ? 'super_admin' : 'admin');
    
    // Check if caller can manage the target role
    if (makeAdmin && !canManageRole(callerRole, role as AdminRole)) {
      throw new HttpsError(
        "permission-denied",
        `You cannot grant role '${role}'. Your role: '${callerRole}'.`
      );
    }
    
    // Get user by email
    logger.info("Retrieving user by email");
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    
    logger.setContext({ targetUid: uid });
    logger.info("User found, setting custom claims");
    
    // Set the custom claims with role
    if (makeAdmin) {
      await admin.auth().setCustomUserClaims(uid, { 
        admin: true, 
        role: role as AdminRole 
      });
    } else {
      await admin.auth().setCustomUserClaims(uid, { admin: false });
    }
    
    // Update Firestore admin config
    logger.info("Updating admin config in Firestore");
    
    if (makeAdmin) {
      // Add or update admin user
      const existingUserIndex = adminConfig.adminUsers.findIndex(u => u.email === email);
      const adminUser = {
        email,
        role: role as AdminRole,
        permissions: [],
        invitedBy: callerEmail,
        invitedAt: new Date(),
        activatedAt: new Date(),
        status: 'active' as const
      };
      
      if (existingUserIndex >= 0) {
        adminConfig.adminUsers[existingUserIndex] = adminUser;
      } else {
        adminConfig.adminUsers.push(adminUser);
      }
    } else {
      // Remove admin user
      adminConfig.adminUsers = adminConfig.adminUsers.filter(u => u.email !== email);
    }
    
    // Update legacy adminEmails array for backward compatibility
    const allAdminEmails = adminConfig.adminUsers.map(u => u.email);
    
    await adminConfigRef.set({
      ...adminConfig,
      adminEmails: allAdminEmails // Keep for compatibility
    }, { merge: true });
    
    logger.info("Admin role management completed successfully");
    
    return {
      success: true,
      message: `Successfully ${makeAdmin ? 'granted' : 'revoked'} admin role${makeAdmin ? ` (${role})` : ''} for ${email}.`,
      adminConfig: {
        totalAdmins: adminConfig.adminUsers.length,
        roles: adminConfig.adminUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
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