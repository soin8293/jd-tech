
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { hotelRooms } from "@/data/hotel.data";
import { Room } from "@/types/hotel.types";
import RoomManager from "@/components/hotel/RoomManager";

const RoomManagement = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>(hotelRooms);
  
  const handleSaveRooms = (updatedRooms: Room[]) => {
    setRooms(updatedRooms);
    
    // In a real application, this would save to a database or API
    // For now, we'll just show a toast to simulate saving
    toast({
      title: "Rooms updated",
      description: "Your room changes have been saved",
    });
    
    // Log the updated rooms so we can see the changes
    console.log("Updated rooms:", updatedRooms);
  };
  
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
        <div className="max-w-5xl mx-auto">
          <RoomManager 
            initialRooms={rooms} 
            onSaveRooms={handleSaveRooms} 
          />
        </div>
      </main>
    </div>
  );
};

export default RoomManagement;
