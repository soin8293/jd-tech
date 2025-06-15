import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";
import { AdminConfig, AdminRole, AdminInvitation, canManageRole } from "../types/admin.types";
import { v4 as uuidv4 } from 'uuid';

const inviteAdminHandler = async (request: any) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { email, role = 'moderator' } = request.data;
  const callerEmail = request.auth.token.email;

  logger.setContext({ email, role, callerEmail });
  logger.info("Inviting admin user");

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
        "Admin system not initialized. Please contact a super admin."
      );
    }

    const adminConfig = adminConfigSnap.data() as AdminConfig;
    
    // Check caller permissions
    const callerAdminUser = adminConfig.adminUsers.find(u => u.email === callerEmail);
    const isHardcodedSuperAdmin = adminConfig.superAdmins.includes(callerEmail);
    
    if (!callerAdminUser && !isHardcodedSuperAdmin) {
      throw new HttpsError(
        "permission-denied",
        "Only admins can invite new users."
      );
    }

    const callerRole = callerAdminUser?.role || 'super_admin';
    
    // Check if caller can manage this role
    if (!canManageRole(callerRole, role as AdminRole)) {
      throw new HttpsError(
        "permission-denied",
        `You cannot invite users with role '${role}'. Your role: '${callerRole}'.`
      );
    }

    // Check if user is already an admin
    const existingAdmin = adminConfig.adminUsers.find(u => u.email === email);
    if (existingAdmin) {
      throw new HttpsError(
        "already-exists",
        `User ${email} is already an admin with role '${existingAdmin.role}'.`
      );
    }

    // Check for existing invitation
    const existingInvitation = adminConfig.invitations.find(
      inv => inv.email === email && inv.status === 'pending'
    );
    
    if (existingInvitation) {
      throw new HttpsError(
        "already-exists",
        `An invitation for ${email} is already pending.`
      );
    }

    // Check admin limit
    if (adminConfig.adminUsers.length >= adminConfig.settings.maxAdmins) {
      throw new HttpsError(
        "resource-exhausted",
        `Maximum number of admins (${adminConfig.settings.maxAdmins}) reached.`
      );
    }

    // Create invitation
    const invitation: AdminInvitation = {
      id: uuidv4(),
      email,
      role: role as AdminRole,
      invitedBy: callerEmail,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + adminConfig.settings.invitationExpiryHours * 60 * 60 * 1000),
      token: uuidv4(),
      status: 'pending'
    };

    // Add invitation to config
    adminConfig.invitations.push(invitation);

    await adminConfigRef.update({
      invitations: adminConfig.invitations
    });

    // TODO: Send invitation email (implement when email service is available)
    logger.info("Admin invitation created", { invitationId: invitation.id });

    return {
      success: true,
      message: `Invitation sent to ${email} for role '${role}'.`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitationLink: `${process.env.FRONTEND_URL}/admin/accept-invitation?token=${invitation.token}`
      }
    };
  } catch (error: any) {
    logger.error("Failed to invite admin", error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal", 
      "Failed to send admin invitation."
    );
  }
};

export const inviteAdmin = onCall(
  asyncHandler(inviteAdminHandler, 'inviteAdmin')
);