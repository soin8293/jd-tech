// Admin role hierarchy types for Cloud Functions
export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminUser {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  invitedBy?: string;
  invitedAt?: Date;
  activatedAt?: Date;
  lastLogin?: Date;
  status: 'invited' | 'active' | 'suspended';
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: AdminRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

export type AdminPermission = 
  | 'rooms.read' 
  | 'rooms.write' 
  | 'rooms.delete'
  | 'bookings.read' 
  | 'bookings.write' 
  | 'bookings.cancel'
  | 'admin.invite' 
  | 'admin.manage' 
  | 'admin.remove'
  | 'system.config'
  | 'system.backup';

export interface AdminConfig {
  superAdmins: string[]; // Hardcoded fallback emails
  adminUsers: AdminUser[];
  invitations: AdminInvitation[];
  settings: {
    requireEmailVerification: boolean;
    invitationExpiryHours: number;
    maxAdmins: number;
    allowSelfRegistration: boolean;
  };
}

// Role permission mappings
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'rooms.read', 'rooms.write', 'rooms.delete',
    'bookings.read', 'bookings.write', 'bookings.cancel',
    'admin.invite', 'admin.manage', 'admin.remove',
    'system.config', 'system.backup'
  ],
  admin: [
    'rooms.read', 'rooms.write', 'rooms.delete',
    'bookings.read', 'bookings.write', 'bookings.cancel',
    'admin.invite'
  ],
  moderator: [
    'rooms.read', 'rooms.write',
    'bookings.read', 'bookings.write'
  ]
};

export const hasPermission = (userRole: AdminRole, permission: AdminPermission): boolean => {
  return ROLE_PERMISSIONS[userRole].includes(permission);
};

export const canManageRole = (managerRole: AdminRole, targetRole: AdminRole): boolean => {
  const hierarchy: Record<AdminRole, number> = {
    moderator: 1,
    admin: 2,
    super_admin: 3
  };
  
  return hierarchy[managerRole] > hierarchy[targetRole];
};