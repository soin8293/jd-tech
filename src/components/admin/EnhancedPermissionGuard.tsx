
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedPermissions, Permission } from "@/hooks/useEnhancedPermissions";
import { useSecurityAuditLogger } from "@/hooks/useSecurityAuditLogger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingScreen from "@/components/common/LoadingScreen";

interface EnhancedPermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  resource?: string;
  action?: string;
  fallbackComponent?: React.ReactNode;
}

export const EnhancedPermissionGuard: React.FC<EnhancedPermissionGuardProps> = ({
  children,
  requiredPermissions = [],
  resource,
  action,
  fallbackComponent
}) => {
  const { currentUser, isAdmin, isLoading, authInitialized, signInWithGoogle, refreshUserClaims } = useAuth();
  const { userPermissions, loading: permissionsLoading, hasAnyPermission, canAccessResource } = useEnhancedPermissions();
  const { logFailedAccess, logAuthEvent } = useSecurityAuditLogger();

  // Check permissions
  const hasRequiredPermissions = () => {
    if (requiredPermissions.length > 0) {
      return hasAnyPermission(requiredPermissions);
    }
    if (resource && action) {
      return canAccessResource(resource, action);
    }
    return isAdmin; // Fallback to admin check
  };

  // Log failed access attempts
  useEffect(() => {
    if (authInitialized && currentUser && !isLoading && !permissionsLoading) {
      if (!hasRequiredPermissions()) {
        const resourceName = resource || 'protected_component';
        const requiredPerms = requiredPermissions.length > 0 
          ? requiredPermissions.join(', ') 
          : `${resource}.${action}`;
        
        logFailedAccess(resourceName, `Missing required permissions: ${requiredPerms}`);
      }
    }
  }, [authInitialized, currentUser, isLoading, permissionsLoading, hasRequiredPermissions, logFailedAccess, resource, action, requiredPermissions]);

  // Show loading state while checking
  if (isLoading || !authInitialized || permissionsLoading) {
    return <LoadingScreen message="Checking permissions..." fullScreen />;
  }

  // User not authenticated
  if (!currentUser) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className="min-h-screen pt-16 container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to sign in to access this resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please sign in with your Google account to continue.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => {
                signInWithGoogle();
                logAuthEvent('SIGN_IN_ATTEMPT', { trigger: 'permission_guard' });
              }} 
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PRIORITY: Always allow access for super admin
  if (currentUser.email === 'amirahcolorado@gmail.com') {
    return <>{children}</>;
  }

  // Check permissions
  if (!hasRequiredPermissions()) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className="min-h-screen pt-16 container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Insufficient Permissions
            </CardTitle>
            <CardDescription>
              You don't have the required permissions to access this resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This resource requires specific permissions that you don't currently have.
                Please contact your administrator or try refreshing your permissions.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={refreshUserClaims} 
                variant="outline" 
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Permissions
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
                className="flex-1"
              >
                Return Home
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>Current Status:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Signed in as: {currentUser.email}</li>
                <li>Role: {userPermissions?.role || 'unknown'}</li>
                <li>Required: {requiredPermissions.join(', ') || `${resource}.${action}`}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required permissions
  return <>{children}</>;
};

export default EnhancedPermissionGuard;
