
import React, { useEffect, useState } from "react";
import { useRoomManagement } from "@/hooks/useRoomManagement";
import RoomManager from "@/components/hotel/RoomManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import AdminManageDialog from "@/components/admin/AdminManageDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const RoomManagement = () => {
  const { rooms, loading, error, usingLocalData, fetchRooms, handleSaveRooms, handleDeleteRoom } = useRoomManagement();
  const { isAdmin, currentUser, refreshUserClaims } = useAuth();
  const { toast } = useToast();
  const [showAdminManagement, setShowAdminManagement] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Redirect non-admin users
  if (!isAdmin) {
    toast({
      title: "Access Denied",
      description: "You need administrator privileges to access this page.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-16 container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setShowAdminManagement(true)}
        >
          <UserPlus className="h-4 w-4" />
          Manage Admins
        </Button>
        
        {currentUser?.email === "amirahcolorado@gmail.com" && (
          <InitializeAdmin />
        )}
      </div>

      {showAdminManagement && (
        <AdminManageDialog
          onClose={() => setShowAdminManagement(false)}
          refreshUserClaims={refreshUserClaims}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Room Management</CardTitle>
          <CardDescription>
            Add, edit, or remove rooms from your hotel inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomManager
            initialRooms={rooms}
            onSaveRooms={handleSaveRooms}
            onDeleteRoom={handleDeleteRoom}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomManagement;
