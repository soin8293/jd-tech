
import React, { useState, useEffect } from "react";
import { Room, RoomFormData } from "@/types/hotel.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import RoomList from "./RoomList";
import RoomEditForm from "./RoomEditForm";
import DeleteRoomDialog from "./DeleteRoomDialog";
import { AdvancedRoomSearch } from "./AdvancedRoomSearch";
import { useRoomQuery } from "@/hooks/useRoomQuery";

const defaultRoom: RoomFormData = {
  name: "New Room",
  description: "Description of the new room",
  price: 250,
  capacity: 2,
  size: 400,
  bed: "Queen",
  amenities: ["Free Wi-Fi", "TV", "Air Conditioning"],
  images: [],
  availability: true
};

interface RoomManagerProps {
  initialRooms: Room[];
  onSaveRooms: (rooms: Room[]) => void;
  onDeleteRoom?: (roomId: string) => void;
  showEditButtons?: boolean;
  isLoading?: boolean;
}

const RoomManager: React.FC<RoomManagerProps> = ({ 
  initialRooms, 
  onSaveRooms,
  onDeleteRoom,
  showEditButtons = true,
  isLoading = false
}) => {
  const { toast } = useToast();
  
  // Use state for rooms instead of directly using the query data
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(initialRooms);
  const [editingRoom, setEditingRoom] = useState<RoomFormData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('view');
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  // Initialize with the query data
  useEffect(() => {
    if (initialRooms.length > 0) {
      setRooms(initialRooms);
      setFilteredRooms(initialRooms);
    }
  }, [initialRooms]);

  const handleAddRoom = () => {
    setEditingRoom({ ...defaultRoom });
    setIsAdding(true);
    setActiveTab('edit');
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom({ ...room });
    setIsAdding(false);
    setActiveTab('edit');
  };

  const handleDeleteRoom = (roomId: string) => {
    if (onDeleteRoom) {
      setRoomToDelete(null);
      onDeleteRoom(roomId);
    } else {
      const updatedRooms = rooms.filter(room => room.id !== roomId);
      setRooms(updatedRooms);
      onSaveRooms(updatedRooms);
      
      toast({
        title: "Room deleted",
        description: "The room has been removed from your offerings",
      });
    }
  };

  const handleSaveRoom = (roomData: RoomFormData) => {
    if (!roomData.name || !roomData.price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (name and price).",
        variant: "destructive",
      });
      return;
    }
    
    const roomToSave: Room = {
      ...roomData,
      id: roomData.id || `room-${Date.now()}`,
      bookings: []
    };
    
    if (isAdding) {
      const updatedRooms = [...rooms, roomToSave];
      setRooms(updatedRooms);
      onSaveRooms(updatedRooms);
    } else {
      const updatedRooms = rooms.map(room => 
        room.id === roomToSave.id ? roomToSave : room
      );
      setRooms(updatedRooms);
      onSaveRooms(updatedRooms);
    }
    
    setEditingRoom(null);
    setActiveTab('view');
    
    toast({
      title: isAdding ? "Room added" : "Room updated",
      description: `The room has been ${isAdding ? 'added to' : 'updated in'} your offerings.`,
    });
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="view">View Rooms</TabsTrigger>
          <TabsTrigger value="edit" disabled={!editingRoom}>
            {isAdding ? "Add New Room" : "Edit Room"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="view" className="mt-4 space-y-4">
          <AdvancedRoomSearch
            rooms={rooms}
            onFilteredRoomsChange={setFilteredRooms}
          />
          <RoomList
            rooms={filteredRooms}
            showEditButtons={showEditButtons}
            isLoading={isLoading}
            onAddRoom={handleAddRoom}
            onEditRoom={handleEditRoom}
            onDeleteRoom={(roomId) => setRoomToDelete(roomId)}
          />
        </TabsContent>
        
        <TabsContent value="edit" className="mt-4">
          {editingRoom && (
            <RoomEditForm
              editingRoom={editingRoom}
              isAdding={isAdding}
              isLoading={isLoading}
              onSave={handleSaveRoom}
              onCancel={() => {
                setEditingRoom(null);
                setActiveTab('view');
              }}
            />
          )}
        </TabsContent>
      </Tabs>
      
      <DeleteRoomDialog
        isOpen={!!roomToDelete}
        onClose={() => setRoomToDelete(null)}
        onConfirm={() => roomToDelete && handleDeleteRoom(roomToDelete)}
      />
    </div>
  );
};

export default RoomManager;
