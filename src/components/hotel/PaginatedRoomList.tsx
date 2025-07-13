import React from "react";
import { Room, BookingPeriod, RoomAvailabilityCheck } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RoomCard from "./RoomCard";
import { Skeleton } from "@/components/ui/skeleton";

interface PaginatedRoomListProps {
  rooms: Room[];
  selectedRooms: Room[];
  onSelectRoom: (room: Room) => void;
  bookingPeriod?: BookingPeriod;
  roomAvailability: Record<string, RoomAvailabilityCheck>;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}

const RoomCardSkeleton = () => (
  <div className="bg-card rounded-lg border p-6">
    <div className="flex gap-6">
      <Skeleton className="w-48 h-32 rounded-lg" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  </div>
);

const PaginatedRoomList: React.FC<PaginatedRoomListProps> = ({
  rooms,
  selectedRooms,
  onSelectRoom,
  bookingPeriod,
  roomAvailability,
  isLoading,
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 bg-secondary/50 rounded-lg">
        <h3 className="text-xl font-medium mb-2">No rooms found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or dates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {rooms.length} of {totalResults} rooms
        </p>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground px-3">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Room cards */}
      <div className="grid grid-cols-1 gap-6 animate-fade-in">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onSelect={() => onSelectRoom(room)}
            isSelected={selectedRooms.some(r => r.id === room.id)}
            availability={roomAvailability[room.id]}
            bookingPeriod={bookingPeriod}
            context="booking"
            showEditButtons={false}
          />
        ))}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground px-3">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedRoomList;