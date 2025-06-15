import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdminInviteDialog from "./AdminInviteDialog";
import AdminManageDialog from "./AdminManageDialog";
import { AdminRole } from "@/types/hotel.types";

interface AdminRoleManagerProps {
  className?: string;
}

const AdminRoleManager: React.FC<AdminRoleManagerProps> = ({ className = "" }) => {
  const { isAdmin, refreshUserClaims } = useAuth();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const getRoleBadgeVariant = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'default'; // Usually blue
      case 'admin':
        return 'secondary'; // Usually gray
      case 'moderator':
        return 'outline'; // Usually outlined
      default:
        return 'secondary';
    }
  };

  const getRoleDescription = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'Full system access including admin management';
      case 'admin':
        return 'Manage rooms, bookings, and invite new admins';
      case 'moderator':
        return 'Manage rooms and bookings only';
      default:
        return 'Unknown role';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Role Management
          </CardTitle>
          <CardDescription>
            Manage administrator roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['super_admin', 'admin', 'moderator'] as AdminRole[]).map((role) => (
              <div key={role} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getRoleBadgeVariant(role)}>
                    {role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(role)}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="h-4 w-4" />
              Invite Admin
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowManageDialog(true)}
            >
              <Settings className="h-4 w-4" />
              Manage Existing
            </Button>
          </div>
        </CardContent>
      </Card>

      {showInviteDialog && (
        <AdminInviteDialog
          onClose={() => setShowInviteDialog(false)}
          refreshUserClaims={refreshUserClaims}
        />
      )}

      {showManageDialog && (
        <AdminManageDialog
          onClose={() => setShowManageDialog(false)}
          refreshUserClaims={refreshUserClaims}
        />
      )}
    </div>
  );
};

export default AdminRoleManager;