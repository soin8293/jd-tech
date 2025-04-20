
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, RefreshCw } from "lucide-react";
import AdminManageDialog from "./AdminManageDialog";
import InitAdminDialog from "./InitAdminDialog";

const AdminMenu: React.FC = () => {
  const { isAdmin, refreshUserClaims } = useAuth();
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [showInitAdminDialog, setShowInitAdminDialog] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Manage your hotel settings and content as an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/room-management">
              <Button variant="secondary" className="w-full">Manage Rooms</Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsManagingAdmins(true)}
            >
              Manage Admins
            </Button>
          </div>
        </CardContent>
      </Card>

      {isManagingAdmins && (
        <AdminManageDialog
          onClose={() => setIsManagingAdmins(false)}
          refreshUserClaims={refreshUserClaims}
        />
      )}

      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1"
        onClick={() => setShowInitAdminDialog(true)}
      >
        <RefreshCw className="h-4 w-4" />
        Initialize Admin
      </Button>

      <InitAdminDialog
        open={showInitAdminDialog}
        onOpenChange={setShowInitAdminDialog}
        refreshUserClaims={refreshUserClaims}
      />
    </div>
  );
};

export default AdminMenu;
