import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";
import { AdminConfig, AdminRole, AdminUser } from "../types/admin.types";

// Hardcoded super admin emails (fallback system)
const HARDCODED_SUPER_ADMINS = [
  "amirahcolorado@gmail.com"
];

const setupDynamicAdminHandler = async (request: any) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { targetEmail, role = 'admin' } = request.data;
  const callerEmail = request.auth.token.email;

  logger.setContext({ targetEmail, role, callerEmail });
  logger.info("Setting up dynamic admin");

  // Initialize Firebase Admin if needed
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  try {
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    const adminConfigSnap = await adminConfigRef.get();
    
    let adminConfig: AdminConfig;
    
    if (!adminConfigSnap.exists) {
      // Initialize admin config with hardcoded super admins
      adminConfig = {
        superAdmins: HARDCODED_SUPER_ADMINS,
        adminUsers: [],
        invitations: [],
        settings: {
          requireEmailVerification: true,
          invitationExpiryHours: 72,
          maxAdmins: 50,
          allowSelfRegistration: false
        }
      };
      
      // Add hardcoded super admins as active users
      for (const email of HARDCODED_SUPER_ADMINS) {
        try {
          const userRecord = await admin.auth().getUserByEmail(email);
          await admin.auth().setCustomUserClaims(userRecord.uid, { 
            admin: true, 
            role: 'super_admin' 
          });
          
          adminConfig.adminUsers.push({
            email,
            role: 'super_admin',
            permissions: [],
            status: 'active',
            activatedAt: new Date()
          });
        } catch (error) {
          logger.warn(`Could not find hardcoded admin: ${email}`);
        }
      }
      
      await adminConfigRef.set(adminConfig);
      logger.info("Admin config initialized with hardcoded super admins");
    } else {
      adminConfig = adminConfigSnap.data() as AdminConfig;
    }

    // Check if caller has permission (super admin or hardcoded)
    const isHardcodedSuperAdmin = HARDCODED_SUPER_ADMINS.includes(callerEmail);
    const callerAdminUser = adminConfig.adminUsers.find(u => u.email === callerEmail);
    const isSuperAdmin = callerAdminUser?.role === 'super_admin';

    if (!isHardcodedSuperAdmin && !isSuperAdmin) {
      throw new HttpsError(
        "permission-denied",
        "Only super admins can set up new admins."
      );
    }

    // Find or create target user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(targetEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new HttpsError(
          "not-found",
          `User with email ${targetEmail} not found. They must sign up first.`
        );
      }
      throw error;
    }

    // Set custom claims based on role
    await admin.auth().setCustomUserClaims(userRecord.uid, { 
      admin: true, 
      role: role 
    });

    // Add or update admin user in config
    const existingUserIndex = adminConfig.adminUsers.findIndex(u => u.email === targetEmail);
    const adminUser: AdminUser = {
      email: targetEmail,
      role: role as AdminRole,
      permissions: [],
      invitedBy: callerEmail,
      invitedAt: new Date(),
      activatedAt: new Date(),
      status: 'active'
    };

    if (existingUserIndex >= 0) {
      adminConfig.adminUsers[existingUserIndex] = adminUser;
    } else {
      adminConfig.adminUsers.push(adminUser);
    }

    // Update legacy adminEmails array for backward compatibility
    const allAdminEmails = adminConfig.adminUsers.map(u => u.email);
    
    await adminConfigRef.update({
      adminUsers: adminConfig.adminUsers,
      adminEmails: allAdminEmails // Keep for compatibility
    });

    logger.info("Dynamic admin setup completed successfully");

    return {
      success: true,
      message: `Successfully set ${targetEmail} as ${role}.`,
      adminConfig: {
        totalAdmins: adminConfig.adminUsers.length,
        roles: adminConfig.adminUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
  } catch (error: any) {
    logger.error("Failed to setup dynamic admin", error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal", 
      "Failed to setup admin user."
    );
  }
};

export const setupDynamicAdmin = onCall(
  asyncHandler(setupDynamicAdminHandler, 'setupDynamicAdmin')
);