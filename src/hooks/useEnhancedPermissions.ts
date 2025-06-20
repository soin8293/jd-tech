
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Permission = 
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
  | 'audit.read';

export interface UserPermissions {
  role: 'super_admin' | 'admin' | 'user';
  permissions: Permission[];
  restrictions?: {
    maxRoomsManaged?: number;
    allowedActions?: string[];
    timeRestrictions?: {
      start: string;
      end: string;
    };
  };
}

const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'rooms.read', 'rooms.write', 'rooms.delete',
    'bookings.read', 'bookings.write', 'bookings.cancel',
    'admin.invite', 'admin.manage', 'admin.remove',
    'system.config', 'audit.read'
  ],
  admin: [
    'rooms.read', 'rooms.write', 'rooms.delete',
    'bookings.read', 'bookings.write', 'bookings.cancel'
  ],
  user: ['bookings.read']
};

export const useEnhancedPermissions = () => {
  const { currentUser, isAdmin } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!currentUser) {
        setUserPermissions(null);
        setLoading(false);
        return;
      }

      try {
        // Check for custom permissions in Firestore
        const userDoc = await getDoc(doc(db, 'userPermissions', currentUser.uid));
        
        if (userDoc.exists()) {
          const customPermissions = userDoc.data() as UserPermissions;
          setUserPermissions(customPermissions);
        } else {
          // Fallback to role-based permissions
          const role = currentUser.email === 'amirahcolorado@gmail.com' 
            ? 'super_admin' 
            : isAdmin 
              ? 'admin' 
              : 'user';

          setUserPermissions({
            role,
            permissions: DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.user
          });
        }
      } catch (error) {
        console.error('Failed to load user permissions:', error);
        // Fallback to minimal permissions
        setUserPermissions({
          role: 'user',
          permissions: DEFAULT_PERMISSIONS.user
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, [currentUser, isAdmin]);

  const hasPermission = (permission: Permission): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!userPermissions) return false;
    return permissions.some(permission => userPermissions.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!userPermissions) return false;
    return permissions.every(permission => userPermissions.permissions.includes(permission));
  };

  const canAccessResource = (resource: string, action: string): boolean => {
    const permission = `${resource}.${action}` as Permission;
    return hasPermission(permission);
  };

  return {
    userPermissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource
  };
};
