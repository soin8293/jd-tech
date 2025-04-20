
import React from "react";
import { Room } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Pencil, TrashIcon } from "lucide-react";
import RoomCard from "./RoomCard";

interface RoomListProps {
  rooms: Room[];
  showEditButtons?: boolean;
  isLoading?: boolean;
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({
  rooms,
  showEditButtons = true,
  isLoading = false,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {rooms.length > 0 && showEditButtons && (
          <Button onClick={onAddRoom} className="gap-1" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Add Room
          </Button>
        )}
      </div>

      {isLoading && rooms.length > 0 && (
        <div className="flex items-center justify-center py-4 space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Processing...</span>
        </div>
      )}

      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {rooms.map((room) => (
            <div key={room.id} className="relative">
              <RoomCard
                room={room}
                onSelect={() => {}}
                className={showEditButtons ? "pr-16" : ""}
              />
              {showEditButtons && (
                <div className="absolute top-4 right-4 flex flex-col gap-1">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onEditRoom(room)}
                    className="h-8 w-8"
                    disabled={isLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onDeleteRoom(room.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={isLoading}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary/50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No rooms available</h3>
          <p className="text-muted-foreground mb-4">
            Add your first room to start attracting guests
          </p>
          {showEditButtons && (
            <Button onClick={onAddRoom} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              Add Your First Room
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomList;
