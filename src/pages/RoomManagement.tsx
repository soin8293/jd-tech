
import React, { useEffect } from "react";
import { Room } from "@/types/hotel.types";
import RoomManager from "@/components/hotel/RoomManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "@/components/hotel/LoadingSpinner";
import LocalDataBanner from "@/components/hotel/LocalDataBanner";
import { useRoomManagement } from "@/hooks/useRoomManagement";

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
  
  useEffect(() => {
    if (!authLoading) {
      fetchRooms();
    }
  }, [authLoading, fetchRooms]);
  
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
          <h1 className="text-2xl font-bold">Room Management</h1>
          <p className="text-primary-foreground/80">
            Add, edit, or remove room offerings for your hotel
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
        
        <div className="max-w-5xl mx-auto">
          <RoomManager 
            initialRooms={rooms} 
            onSaveRooms={handleSaveRooms} 
            onDeleteRoom={handleDeleteRoom}
            showEditButtons={true}
            isLoading={loading}
          />
        </div>
      </main>
    </div>
  );
};

export default RoomManagement;
