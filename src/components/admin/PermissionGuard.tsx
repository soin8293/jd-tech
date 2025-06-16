
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingScreen from "@/components/common/LoadingScreen";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallbackComponent?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRole = 'admin',
  fallbackComponent
}) => {
  const { currentUser, isAdmin, isLoading, authInitialized, signInWithGoogle, refreshUserClaims } = useAuth();

  // Show loading state while checking authentication
  if (isLoading || !authInitialized) {
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
              You need to sign in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please sign in with your Google account to continue.
              </AlertDescription>
            </Alert>
            
            <Button onClick={signInWithGoogle} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PRIORITY: Always allow access for amirahcolorado@gmail.com
  if (currentUser.email === 'amirahcolorado@gmail.com') {
    return <>{children}</>;
  }

  // User authenticated but lacks required permissions
  if (requiredRole === 'admin' && !isAdmin) {
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
              You don't have the required permissions to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This page requires administrator privileges. If you believe you should have access, 
                try refreshing your permissions or contact your system administrator.
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
                <li>Admin status: {isAdmin ? 'Yes' : 'No'}</li>
                <li>Required role: {requiredRole}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required permissions, render children
  return <>{children}</>;
};

export default PermissionGuard;
