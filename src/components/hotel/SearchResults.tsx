
import React from "react";
import { Room, RoomAvailabilityCheck } from "@/types/hotel.types";
import RoomCard from "./RoomCard";

interface SearchResultsProps {
  hasSearched: boolean;
  isLoading: boolean;
  availableRooms: Room[];
  roomAvailability: Record<string, RoomAvailabilityCheck>;
  selectedRooms: Room[];
  onSelectRoom: (room: Room) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  hasSearched,
  isLoading,
  availableRooms,
  roomAvailability,
  selectedRooms,
  onSelectRoom,
}) => {
  if (!hasSearched) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-light mb-3">Find Your Perfect Stay</h2>
        <p className="text-muted-foreground">
          Search above to see available rooms for your dates
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">
          Available Rooms
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({availableRooms.filter(room => 
              roomAvailability[room.id]?.isAvailable !== false
            ).length} available)
          </span>
        </h2>
      </div>
      
      {availableRooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {availableRooms.map((room) => {
            const availability = roomAvailability[room.id] || { isAvailable: true };
            return (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={onSelectRoom}
                selectedRooms={selectedRooms}
                isAvailable={availability.isAvailable}
                nextAvailableTime={availability.nextAvailableTime}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary/50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No rooms available</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or dates
          </p>
        </div>
      )}
    </>
  );
};

export default SearchResults;
