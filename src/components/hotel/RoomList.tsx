
import React from "react";
import { Room, BookingPeriod, RoomAvailabilityCheck } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import RoomCard from "./RoomCard";

export interface RoomListProps {
  rooms: Room[];
  selectedRooms?: Room[];
  onSelectRoom?: (room: Room) => void;
  bookingPeriod?: BookingPeriod;
  roomAvailability?: Record<string, RoomAvailabilityCheck>;
  onBookNow?: () => void;
  context?: "booking" | "room-management";
  showEditButtons?: boolean;
  isLoading?: boolean;
  onAddRoom?: () => void;
  onEditRoom?: (room: Room) => void;
  onDeleteRoom?: (roomId: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({
  rooms,
  selectedRooms = [],
  onSelectRoom = () => {},
  bookingPeriod,
  roomAvailability = {},
  onBookNow = () => {},
  context = "room-management",
  showEditButtons = true,
  isLoading = false,
  onAddRoom = () => {},
  onEditRoom = () => {},
  onDeleteRoom = () => {},
}) => {
  const isBookingContext = context === "booking";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {showEditButtons && !isBookingContext && (
          <Button onClick={onAddRoom} className="gap-1" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Add Room
          </Button>
        )}
        
        {isBookingContext && selectedRooms.length > 0 && (
          <Button onClick={onBookNow} className="ml-auto" disabled={isLoading}>
            Book {selectedRooms.length} Room{selectedRooms.length !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4 space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Processing...</span>
        </div>
      )}

      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onSelect={() => onSelectRoom(room)}
              selectedRooms={selectedRooms}
              availability={roomAvailability[room.id]}
              bookingPeriod={bookingPeriod}
              onEdit={() => onEditRoom(room)}
              onDelete={() => onDeleteRoom(room.id)}
              context={context}
              className="shadow-sm"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary/50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No rooms available</h3>
          <p className="text-muted-foreground mb-4">
            {isBookingContext
              ? "No rooms match your search criteria. Try adjusting your dates or guest count."
              : "Add your first room to start attracting guests"}
          </p>
          {showEditButtons && !isBookingContext && (
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
