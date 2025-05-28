
import React, { useEffect, useState } from "react";
import { useRoomManagement } from "@/hooks/useRoomManagement";
import RoomManager from "@/components/hotel/RoomManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import AdminManageDialog from "@/components/admin/AdminManageDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { getRooms } from "@/services/room/roomQueries";

const RoomManagement = () => {
  const { rooms, loading, error, usingLocalData, fetchRooms, handleSaveRooms, handleDeleteRoom } = useRoomManagement();
  const { isAdmin, currentUser, refreshUserClaims } = useAuth();
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log("Room Management: Current rooms state:", rooms);
    
    const initializeRooms = async () => {
      try {
        console.log('Initializing rooms in RoomManagement...');
        // Directly fetch rooms from the query function to ensure we get the latest data
        const fetchedRooms = await getRooms();
        console.log('Directly fetched rooms:', fetchedRooms);
        
        if (fetchedRooms.length === 0) {
          console.log('No rooms found in Firestore');
        } else if (rooms.length === 0) {
          // If fetchedRooms has data but our state doesn't, update our state
          console.log('Updating local room state with fetched rooms');
          await handleSaveRooms(fetchedRooms);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing rooms:', error);
        setInitialized(true);
      }
    };

    if (!initialized) {
      initializeRooms();
    }
  }, [initialized, handleSaveRooms, rooms.length]);

  // Redirect non-admin users silently without showing the error message
  if (!isAdmin) {
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
          {loading && !initialized ? (
            <div className="text-center py-6">
              <p>Loading rooms...</p>
            </div>
          ) : (
            <RoomManager
              initialRooms={rooms}
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
