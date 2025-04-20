
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Room } from "@/types/hotel.types";
import RoomManager from "@/components/hotel/RoomManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { getRooms, saveRooms, deleteRoom } from "@/services/roomService";
import { Loader2, AlertTriangle } from "lucide-react";
import { hotelRooms } from "@/data/hotel.data";
import { Button } from "@/components/ui/button";

const RoomManagement = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalData, setUsingLocalData] = useState(false);
  
  // Load rooms from Firestore
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        console.log("Fetching rooms...");
        const roomsData = await getRooms();
        console.log("Rooms data received:", roomsData);
        setRooms(roomsData);
        setError(null);
        setUsingLocalData(false);
      } catch (err) {
        console.error("Error loading rooms:", err);
        // Check if it's a permission error
        const isPermissionError = (err as any)?.code === 'permission-denied';
        
        if (isPermissionError) {
          console.log("Permission error detected, using local data instead");
          setRooms(hotelRooms);
          setUsingLocalData(true);
          setError("Database permission error. Using local data until permissions are fixed.");
          toast({
            title: "Using Local Data",
            description: "Unable to access database due to permissions. Using local data for now.",
            variant: "default",
          });
        } else {
          setError("Failed to load rooms. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load rooms. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchRooms();
    }
  }, [toast, authLoading]);
  
  const handleSaveRooms = async (updatedRooms: Room[]) => {
    try {
      setLoading(true);
      
      if (usingLocalData) {
        // If we're using local data, just update the state without saving to Firebase
        setRooms(updatedRooms);
        toast({
          title: "Local changes applied",
          description: "Your changes have been saved locally. They won't persist after page refresh until database permissions are fixed.",
          variant: "default",
        });
      } else {
        // Save to Firestore
        await saveRooms(updatedRooms);
        
        // Update local state
        setRooms(updatedRooms);
        
        toast({
          title: "Rooms updated",
          description: "Your room changes have been saved to the database",
        });
      }
    } catch (err) {
      console.error("Error saving rooms:", err);
      // Check if it's a permission error
      const isPermissionError = (err as any)?.code === 'permission-denied';
      
      if (isPermissionError) {
        // Switch to local data mode
        setUsingLocalData(true);
        setRooms(updatedRooms); // Still update local state
        toast({
          title: "Database Permission Error",
          description: "Changes saved locally only. They won't persist after refresh until permissions are fixed.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save room changes. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRoom = async (roomId: string) => {
    try {
      setLoading(true);
      
      if (usingLocalData) {
        // If we're using local data, just update the state without saving to Firebase
        const updatedRooms = rooms.filter(room => room.id !== roomId);
        setRooms(updatedRooms);
        toast({
          title: "Room deleted locally",
          description: "The room has been removed from your local view",
          variant: "default",
        });
      } else {
        // Delete from Firestore
        await deleteRoom(roomId);
        
        // Update local state
        const updatedRooms = rooms.filter(room => room.id !== roomId);
        setRooms(updatedRooms);
        
        toast({
          title: "Room deleted",
          description: "The room has been removed from your offerings",
        });
      }
    } catch (err) {
      console.error("Error deleting room:", err);
      // Check if it's a permission error
      const isPermissionError = (err as any)?.code === 'permission-denied';
      
      if (isPermissionError) {
        // Switch to local data mode and still delete locally
        setUsingLocalData(true);
        const updatedRooms = rooms.filter(room => room.id !== roomId);
        setRooms(updatedRooms);
        toast({
          title: "Database Permission Error",
          description: "Room removed locally only. This won't persist after refresh until permissions are fixed.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete room. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle authentication states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Redirect non-admin users
  if (!authLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  if (loading && rooms.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Loading rooms...</p>
        </div>
      </div>
    );
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
        {usingLocalData && (
          <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-md mb-6 flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Working with local data</p>
              <p className="text-sm mt-1">
                Unable to connect to the database due to permission issues. Changes will only be saved locally and won't persist after page refresh.
              </p>
            </div>
          </div>
        )}
        
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

