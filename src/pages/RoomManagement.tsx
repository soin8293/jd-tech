
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Room } from "@/types/hotel.types";
import RoomManager from "@/components/hotel/RoomManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { getRooms, saveRooms, deleteRoom } from "@/services/roomService";
import { Loader2 } from "lucide-react";

const RoomManagement = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load rooms from Firestore
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await getRooms();
        setRooms(roomsData);
        setError(null);
      } catch (err) {
        console.error("Error loading rooms:", err);
        setError("Failed to load rooms. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load rooms. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [toast]);
  
  const handleSaveRooms = async (updatedRooms: Room[]) => {
    try {
      setLoading(true);
      // Save to Firestore
      await saveRooms(updatedRooms);
      
      // Update local state
      setRooms(updatedRooms);
      
      toast({
        title: "Rooms updated",
        description: "Your room changes have been saved to the database",
      });
    } catch (err) {
      console.error("Error saving rooms:", err);
      toast({
        title: "Error",
        description: "Failed to save room changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRoom = async (roomId: string) => {
    try {
      setLoading(true);
      // Delete from Firestore
      await deleteRoom(roomId);
      
      // Update local state
      const updatedRooms = rooms.filter(room => room.id !== roomId);
      setRooms(updatedRooms);
      
      toast({
        title: "Room deleted",
        description: "The room has been removed from your offerings",
      });
    } catch (err) {
      console.error("Error deleting room:", err);
      toast({
        title: "Error",
        description: "Failed to delete room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect non-admin users
  if (!isAdmin) {
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
        {error && (
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
