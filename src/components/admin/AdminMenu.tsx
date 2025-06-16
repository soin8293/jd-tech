
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminManageDialog from "./AdminManageDialog";
import InitAdminDialog from "./InitAdminDialog";
import { Button } from "@/components/ui/button";

interface AdminMenuProps {
  roomCount?: number;
}

const AdminMenu: React.FC<AdminMenuProps> = ({ roomCount = 0 }) => {
  const { isAdmin, authInitialized, currentUser, refreshUserClaims } = useAuth();
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [showInitAdminDialog, setShowInitAdminDialog] = useState(false);

  // SECURITY: Triple check - must be authenticated AND admin AND initialized
  if (!authInitialized || !currentUser || !isAdmin) {
    return null;
  }

  return (
    <ScrollArea className="h-[80vh] max-h-[600px]">
      <div className="space-y-4 p-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Admin Dashboard
            </CardTitle>
            <CardDescription>
              Manage administrator accounts and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div className="font-medium">Total Rooms:</div>
                <div>{roomCount}</div>
                <div className="font-medium">Admin Status:</div>
                <div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsManagingAdmins(true)}
            >
              Manage Admins
            </Button>
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
    </ScrollArea>
  );
};

export default AdminMenu;
