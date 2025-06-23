
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminPermissions = () => {
  const { currentUser, isAdmin, authInitialized } = useAuth();
  const [hasImageUploadPermission, setHasImageUploadPermission] = useState(false);
  const [hasRoomManagePermission, setHasRoomManagePermission] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!authInitialized) return;
      
      setIsCheckingPermissions(true);
      
      try {
        if (!currentUser || !isAdmin) {
          setHasImageUploadPermission(false);
          setHasRoomManagePermission(false);
        } else {
          // Get fresh token to ensure admin claims are current
          const idTokenResult = await currentUser.getIdTokenResult(true);
          const hasAdminClaim = !!idTokenResult.claims.admin;
          
          // Super admin check
          const isSuperAdmin = currentUser.email === 'amirahcolorado@gmail.com';
          
          const hasPermissions = hasAdminClaim || isSuperAdmin;
          
          setHasImageUploadPermission(hasPermissions);
          setHasRoomManagePermission(hasPermissions);
          
          console.log('🔐 ADMIN PERMISSIONS: Checked permissions', {
            email: currentUser.email,
            hasAdminClaim,
            isSuperAdmin,
            hasPermissions
          });
        }
      } catch (error) {
        console.error('🔐 ADMIN PERMISSIONS: Error checking permissions:', error);
        setHasImageUploadPermission(false);
        setHasRoomManagePermission(false);
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, [currentUser, isAdmin, authInitialized]);

  return {
    hasImageUploadPermission,
    hasRoomManagePermission,
    isCheckingPermissions,
    canUploadImages: hasImageUploadPermission && !isCheckingPermissions,
    canManageRooms: hasRoomManagePermission && !isCheckingPermissions
  };
};
