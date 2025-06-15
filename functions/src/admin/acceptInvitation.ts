import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";
import { AdminConfig, AdminUser } from "../types/admin.types";

const acceptInvitationHandler = async (request: any) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { token } = request.data;
  const userEmail = request.auth.token.email;

  logger.setContext({ token, userEmail });
  logger.info("Processing invitation acceptance");

  // Initialize Firebase Admin if needed
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  try {
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    const adminConfigSnap = await adminConfigRef.get();
    
    if (!adminConfigSnap.exists) {
      throw new HttpsError(
        "failed-precondition",
        "Admin system not initialized."
      );
    }

    const adminConfig = adminConfigSnap.data() as AdminConfig;
    
    // Find invitation by token
    const invitationIndex = adminConfig.invitations.findIndex(
      inv => inv.token === token && inv.status === 'pending'
    );
    
    if (invitationIndex === -1) {
      throw new HttpsError(
        "not-found",
        "Invalid or expired invitation token."
      );
    }

    const invitation = adminConfig.invitations[invitationIndex];
    
    // Check if invitation email matches authenticated user
    if (invitation.email !== userEmail) {
      throw new HttpsError(
        "permission-denied",
        "This invitation is for a different email address."
      );
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      // Mark invitation as expired
      adminConfig.invitations[invitationIndex].status = 'expired';
      await adminConfigRef.update({
        invitations: adminConfig.invitations
      });
      
      throw new HttpsError(
        "deadline-exceeded",
        "This invitation has expired."
      );
    }

    // Check if user is already an admin
    const existingAdmin = adminConfig.adminUsers.find(u => u.email === userEmail);
    if (existingAdmin) {
      throw new HttpsError(
        "already-exists",
        `You are already an admin with role '${existingAdmin.role}'.`
      );
    }

    // Create admin user
    const adminUser: AdminUser = {
      email: userEmail,
      role: invitation.role,
      permissions: [],
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt,
      activatedAt: new Date(),
      status: 'active'
    };

    // Set custom claims
    await admin.auth().setCustomUserClaims(request.auth.uid, { 
      admin: true, 
      role: invitation.role 
    });

    // Update admin config
    adminConfig.adminUsers.push(adminUser);
    adminConfig.invitations[invitationIndex].status = 'accepted';
    
    // Update legacy adminEmails array for backward compatibility
    const allAdminEmails = adminConfig.adminUsers.map(u => u.email);

    await adminConfigRef.update({
      adminUsers: adminConfig.adminUsers,
      invitations: adminConfig.invitations,
      adminEmails: allAdminEmails // Keep for compatibility
    });

    logger.info("Invitation accepted successfully", { 
      newAdminEmail: userEmail, 
      role: invitation.role 
    });

    return {
      success: true,
      message: `Welcome! You are now an admin with role '${invitation.role}'.`,
      adminUser: {
        email: adminUser.email,
        role: adminUser.role,
        activatedAt: adminUser.activatedAt
      }
    };
  } catch (error: any) {
    logger.error("Failed to accept invitation", error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal", 
      "Failed to accept invitation."
    );
  }
};

export const acceptInvitation = onCall(
  asyncHandler(acceptInvitationHandler, 'acceptInvitation')
);