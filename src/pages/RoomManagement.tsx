
import React, { useEffect, useState } from "react";
import { useRoomManagement } from "@/hooks/useRoomManagement";
import RoomManager from "@/components/hotel/RoomManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import PermissionGuard from "@/components/admin/PermissionGuard";
import AdminStatusIndicator from "@/components/admin/AdminStatusIndicator";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import AdminManageDialog from "@/components/admin/AdminManageDialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Settings } from "lucide-react";
import { getRooms } from "@/services/room/roomQueries";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RoomManagement = () => {
  const { rooms, loading, error, fetchRooms, handleSaveRooms, handleDeleteRoom } = useRoomManagement();
  const { currentUser, refreshUserClaims } = useAuth();
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

  // REMOVED: Dangerous silent redirect that masked permission issues
  // Now using PermissionGuard component for proper auth handling

  return (
    <PermissionGuard requiredRole="admin">
      <div className="min-h-screen pt-16 container mx-auto px-4 py-8">
        {/* Admin Status & Controls Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <AdminStatusIndicator showDetails={false} />
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowAdminManagement(true)}
            >
              <UserPlus className="h-4 w-4" />
              Manage Admins
            </Button>
          </div>
          
          {currentUser?.email === "amirahcolorado@gmail.com" && (
            <InitializeAdmin />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <Settings className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Management Dialog */}
        {showAdminManagement && (
          <AdminManageDialog
            onClose={() => setShowAdminManagement(false)}
            refreshUserClaims={refreshUserClaims}
          />
        )}

        {/* Main Room Management Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Room Management</CardTitle>
            <CardDescription>
              Add, edit, or remove rooms from your hotel inventory. 
              All changes are saved directly to the database with proper permission validation.
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
    </PermissionGuard>
  );
};

export default RoomManagement;
