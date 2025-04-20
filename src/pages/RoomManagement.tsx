
import React, { useEffect } from "react";
import { useRoomManagement } from "@/hooks/useRoomManagement";
import RoomManager from "@/components/hotel/RoomManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import InitializeAdmin from "@/components/admin/InitializeAdmin";

const RoomManagement = () => {
  const { rooms, loading, error, usingLocalData, fetchRooms, handleSaveRooms, handleDeleteRoom } = useRoomManagement();
  const { isAdmin, currentUser } = useAuth();
  const { toast } = useToast();

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
        <div />
        {currentUser?.email === "amirahcolorado@gmail.com" && (
          <InitializeAdmin />
        )}
      </div>

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
