
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Room } from "@/types/hotel.types";
import { Bed, Users, Maximize, Check, Pencil, TrashIcon, Clock, ImageOff, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNigerianTime } from "@/utils/availabilityUtils";

interface RoomCardProps {
  room: Room;
  onSelect?: (room: Room) => void;
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: string) => void;
  selectedRooms?: Room[];
  className?: string;
  context?: 'booking' | 'room-management';
  isAvailable?: boolean;
  nextAvailableTime?: Date;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  onSelect = () => {}, 
  onEdit = () => {}, 
  onDelete = () => {},
  selectedRooms = [],
  className,
  context = 'booking',
  isAvailable = true,
  nextAvailableTime
}) => {
  const isSelected = selectedRooms.some(r => r.id === room.id);
  const hasImages = room.images && room.images.length > 0;
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg relative", 
        isSelected && "ring-2 ring-primary",
        !isAvailable && "opacity-60 grayscale",
        className
      )}
    >
      {!isAvailable && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Flag className="w-3 h-3" />
            Booked
          </Badge>
        </div>
      )}

      {hasImages ? (
        <div className="hotel-image-container h-48 relative">
          <img
            src={room.images[0]}
            alt={room.name}
            className="hotel-image w-full h-full object-cover"
            loading="lazy"
          />
          <div className="image-overlay" />
          
          {!isAvailable && (
            <div className="absolute top-0 right-0 left-0 bg-black bg-opacity-70 text-white py-2 px-4 text-center">
              <p className="text-sm font-medium">Unavailable</p>
              {nextAvailableTime && (
                <p className="text-xs">Available after {formatNigerianTime(nextAvailableTime)}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-muted flex items-center justify-center relative">
          <ImageOff className="w-12 h-12 text-muted-foreground/50" />
          {!isAvailable && (
            <div className="absolute top-0 right-0 left-0 bg-black bg-opacity-70 text-white py-2 px-4 text-center">
              <p className="text-sm font-medium">Unavailable</p>
              {nextAvailableTime && (
                <p className="text-xs">Available after {formatNigerianTime(nextAvailableTime)}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-medium">{room.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">{room.description}</p>
          </div>
          <Badge variant={isSelected ? "default" : "outline"} className="ml-2">
            ${room.price}/night
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1.5" />
            <span>Up to {room.capacity}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Bed className="w-4 h-4 mr-1.5" />
            <span>{room.bed}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Maximize className="w-4 h-4 mr-1.5" />
            <span>{room.size} sq ft</span>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-1.5">
            {room.amenities.slice(0, 5).map((amenity, index) => (
              <div 
                key={index}
                className="flex items-center text-xs bg-secondary px-2 py-1 rounded-full"
              >
                <Check className="w-3 h-3 mr-1" />
                {amenity}
              </div>
            ))}
            {room.amenities.length > 5 && (
              <div className="text-xs bg-secondary px-2 py-1 rounded-full">
                +{room.amenities.length - 5} more
              </div>
            )}
          </div>
        </div>
        
        {!isAvailable && nextAvailableTime && (
          <div className="mt-4 flex items-center text-sm border border-amber-300 bg-amber-50 text-amber-700 rounded p-2">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Available after {formatNigerianTime(nextAvailableTime)}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-4 bg-secondary/40 border-t">
        {context === 'booking' ? (
          <Button 
            className="w-full"
            variant={isSelected ? "outline" : "default"}
            onClick={() => onSelect(room)}
            disabled={!isAvailable}
          >
            {isSelected ? "Remove Selection" : isAvailable ? "Select Room" : "Unavailable"}
          </Button>
        ) : (
          <div className="flex w-full gap-2">
            <Button 
              onClick={() => onEdit(room)}
              variant="outline"
              className="flex-1"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button 
              onClick={() => onDelete(room.id)}
              variant="destructive"
              className="flex-1"
            >
              <TrashIcon className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
