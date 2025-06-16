
import React, { useEffect, useState } from "react";
import { useRoomManagement } from "@/hooks/useRoomManagement";
import RoomManager from "@/components/hotel/RoomManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import PermissionGuard from "@/components/admin/PermissionGuard";
import AdminStatusIndicator from "@/components/admin/AdminStatusIndicator";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import AdminManageDialog from "@/components/admin/AdminManageDialog";
import AdminRoleManager from "@/components/admin/AdminRoleManager";
import ConnectionStatusIndicator from "@/components/admin/ConnectionStatusIndicator";
import { Button } from "@/components/ui/button";
import { UserPlus, Settings, BarChart3, Wrench, Activity } from "lucide-react";
import { RevenueAnalytics } from "@/components/analytics/RevenueAnalytics";
import { MaintenanceScheduler } from "@/components/maintenance/MaintenanceScheduler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRooms } from "@/services/room/roomQueries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TemplateManager } from "@/components/template/TemplateManager";
import { SystemHealthMonitor } from "@/components/monitoring/SystemHealthMonitor";

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

        {/* Admin Role Management */}
        <AdminRoleManager className="mb-6" />

        {/* Connection Status */}
        <ConnectionStatusIndicator showDetails className="mb-6" />

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
              Comprehensive room management with analytics, maintenance scheduling, and system monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rooms" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="monitoring">System Health</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rooms" className="mt-6">
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
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                <RevenueAnalytics />
              </TabsContent>
              
              <TabsContent value="maintenance" className="mt-6">
                <div className="space-y-6">
                  {rooms.map(room => (
                    <MaintenanceScheduler 
                      key={room.id} 
                      roomId={room.id}
                      className="border rounded-lg p-4"
                    />
                  ))}
                  {rooms.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No rooms available for maintenance scheduling
                    </p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="templates" className="mt-6">
                <TemplateManager />
              </TabsContent>
              
              <TabsContent value="availability" className="mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced availability management coming soon</p>
                  <p className="text-sm">This will include real-time availability tracking and conflict resolution</p>
                </div>
              </TabsContent>
              
              <TabsContent value="monitoring" className="mt-6">
                <SystemHealthMonitor />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default RoomManagement;
