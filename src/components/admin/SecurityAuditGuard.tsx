
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";

interface SecurityAuditGuardProps {
  children: React.ReactNode;
  requiredClaims?: string[];
  adminOnly?: boolean;
}

export const SecurityAuditGuard: React.FC<SecurityAuditGuardProps> = ({
  children,
  requiredClaims = [],
  adminOnly = false
}) => {
  const { currentUser, isAdmin, authInitialized } = useAuth();

  // Wait for auth initialization
  if (!authInitialized) {
    return null;
  }

  // Check authentication
  if (!currentUser) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Authentication required to access this resource.
        </AlertDescription>
      </Alert>
    );
  }

  // Check admin requirement
  if (adminOnly && !isAdmin) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Administrator privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  // Additional claims check could be implemented here
  // For future role-based access control

  return <>{children}</>;
};

export default SecurityAuditGuard;
