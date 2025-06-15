import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const AdminStatusIndicator: React.FC<AdminStatusIndicatorProps> = ({
  showDetails = false,
  className = ""
}) => {
  const { currentUser, isAdmin, isLoading, refreshUserClaims } = useAuth();

  if (isLoading) {
    return (
      <Badge variant="secondary" className={className}>
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!currentUser) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        Not Signed In
      </Badge>
    );
  }

  const adminBadge = isAdmin ? (
    <Badge variant="default" className={`bg-green-500 hover:bg-green-600 ${className}`}>
      <ShieldCheck className="h-3 w-3 mr-1" />
      Admin
    </Badge>
  ) : (
    <Badge variant="secondary" className={className}>
      <Shield className="h-3 w-3 mr-1" />
      User
    </Badge>
  );

  if (!showDetails) {
    return adminBadge;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            {adminBadge}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="font-mono">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span>User ID:</span>
              <span className="font-mono">{currentUser.uid.slice(0, 8)}...</span>
            </div>
          </div>
          
          {!isAdmin && (
            <Button 
              onClick={refreshUserClaims} 
              size="sm" 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Permissions
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminStatusIndicator;