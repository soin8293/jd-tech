import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoomList from '@/components/hotel/RoomList';
import { RoomEditDialog } from '@/components/admin/RoomEditDialog';
import DeleteRoomDialog from '@/components/hotel/DeleteRoomDialog';
import { AdvancedRoomSearch } from '@/components/hotel/AdvancedRoomSearch';
import { useRealTimeRooms } from '@/hooks/useRealTimeRooms';
import { Room } from '@/types/hotel.types';

const defaultRoom: Partial<Room> = {
  name: '',
  description: '',
  price: 0,
  capacity: 1,
  size: 0,
  bed: '',
  amenities: [],
  images: [],
  availability: true
};

export const RoomManagementTab = () => {
  const { rooms } = useRealTimeRooms();
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    setEditingRoom(defaultRoom as Room);
    setIsCreating(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsCreating(false);
  };

  const handleCloseDialog = () => {
    setEditingRoom(null);
    setIsCreating(false);
  };

  const handleDeleteRequest = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) setRoomToDelete(room);
  };

  const handleDeleteClose = () => {
    setRoomToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Room Management</h2>
          <p className="text-muted-foreground">Create, edit, and manage hotel rooms</p>
        </div>
        <Button 
          onClick={handleCreateRoom}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Room
        </Button>
      </div>

      {/* Search and Filters */}
      <AdvancedRoomSearch
        rooms={rooms}
        onFilteredRoomsChange={setFilteredRooms}
      />

      {/* Room List */}
      <RoomList
        rooms={filteredRooms.length > 0 ? filteredRooms : rooms}
        onEditRoom={handleEditRoom}
        onDeleteRoom={handleDeleteRequest}
        showEditButtons={true}
        isLoading={false}
      />

      {/* Edit/Create Room Dialog */}
      {editingRoom && (
        <RoomEditDialog
          room={editingRoom}
          isOpen={!!editingRoom}
          onClose={handleCloseDialog}
          isCreating={isCreating}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {roomToDelete && (
        <DeleteRoomDialog
          isOpen={!!roomToDelete}
          onClose={handleDeleteClose}
          onConfirm={() => {
            // For now, just close the dialog - will implement actual deletion later
            handleDeleteClose();
          }}
        />
      )}
    </div>
  );
};