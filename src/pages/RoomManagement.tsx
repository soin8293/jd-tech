
import React, { useEffect, useCallback } from "react";
import RoomManager from "@/components/hotel/RoomManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "@/components/hotel/LoadingSpinner";
import LocalDataBanner from "@/components/hotel/LocalDataBanner";
import { useRoomManagement } from "@/hooks/useRoomManagement";
import AdminMenu from "@/components/admin/AdminMenu";

const RoomManagement = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const {
    rooms,
    loading,
    error,
    usingLocalData,
    fetchRooms,
    handleSaveRooms,
    handleDeleteRoom
  } = useRoomManagement();
  
  const initializePage = useCallback(() => {
    if (!authLoading) {
      fetchRooms();
    }
  }, [authLoading, fetchRooms]);
  
  useEffect(() => {
    initializePage();
  }, [initializePage]);
  
  if (authLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  if (!authLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  if (loading && rooms.length === 0) {
    return <LoadingSpinner message="Loading rooms..." />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">Hotel Management</h1>
          <p className="text-primary-foreground/80">
            Manage your hotel rooms and administrative access
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {usingLocalData && <LocalDataBanner />}
        
        {error && !usingLocalData && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <div className="grid gap-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Admin Management</h2>
            <AdminMenu roomCount={rooms.length} />
          </div>
          
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Room Management</h2>
            <RoomManager 
              initialRooms={rooms} 
              onSaveRooms={handleSaveRooms} 
              onDeleteRoom={handleDeleteRoom}
              showEditButtons={true}
              isLoading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomManagement;
