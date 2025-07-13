import React, { Suspense } from 'react';
import { useRoomManagement } from "@/hooks/useRoomManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/hotel/LoadingSpinner";

// Lazy load admin components to reduce initial bundle size
const RoomManager = React.lazy(() => import('@/components/hotel/RoomManager'));
const AdminDashboardStats = React.lazy(() => import('@/components/admin/AdminDashboardStats'));
const BookingManagement = React.lazy(() => import('@/components/admin/BookingManagement'));

const AdminManagement = () => {
  const { rooms, handleSaveRooms, handleDeleteRoom } = useRoomManagement();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>
            Manage rooms, bookings, and view analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner />}>
            <div className="space-y-8">
              <AdminDashboardStats roomCount={rooms.length} />
              <RoomManager 
                initialRooms={rooms}
                onSaveRooms={handleSaveRooms}
                onDeleteRoom={handleDeleteRoom}
                showEditButtons={true}
              />
              <BookingManagement />
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;