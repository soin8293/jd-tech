
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
import { hotelRooms } from "@/data/hotel.data";

const RoomManagement = () => {
  const { rooms, loading, error, usingLocalData, fetchRooms, handleSaveRooms, handleDeleteRoom } = useRoomManagement();
  const { isAdmin, currentUser, refreshUserClaims } = useAuth();
  const { toast } = useToast();
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      const initializeRooms = async () => {
        try {
          console.log('Initializing rooms...');
          const fetchedRooms = await fetchRooms();
          
          if (!fetchedRooms || fetchedRooms.length === 0) {
            console.log('No rooms found, initializing with default rooms');
            await handleSaveRooms(hotelRooms);
            
            // If saving to Firebase fails due to permissions, at least set local state
            if (rooms.length === 0) {
              console.log('Setting default rooms locally');
              await handleSaveRooms(hotelRooms);
            }
          }
          
          setInitialized(true);
        } catch (error) {
          console.error('Error initializing rooms:', error);
          // If there's an error, set local rooms anyway
          if (rooms.length === 0) {
            console.log('Setting default rooms locally after error');
            await handleSaveRooms(hotelRooms);
          }
          setInitialized(true);
        }
      };

      initializeRooms();
    }
  }, [initialized, fetchRooms, handleSaveRooms, rooms.length]);

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
            Add, edit, or remove rooms from your hotel inventory. {usingLocalData && 
              "(Using local data - some features may be limited)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && rooms.length === 0 && !initialized ? (
            <div className="text-center py-6">
              <p>Loading rooms...</p>
            </div>
          ) : (
            <RoomManager
              initialRooms={rooms.length > 0 ? rooms : hotelRooms}
              onSaveRooms={handleSaveRooms}
              onDeleteRoom={handleDeleteRoom}
              isLoading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomManagement;
