
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Room } from "@/types/hotel.types";
import { Bed, Users, Maximize, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room) => void;
  selectedRooms?: Room[];
  className?: string;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  onSelect, 
  selectedRooms = [],
  className 
}) => {
  const isSelected = selectedRooms.some(r => r.id === room.id);
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg", 
        isSelected && "ring-2 ring-primary",
        className
      )}
    >
      <div className="hotel-image-container h-48">
        <img
          src={room.images[0]}
          alt={room.name}
          className="hotel-image w-full h-full object-cover"
          loading="lazy"
        />
        <div className="image-overlay" />
      </div>
      
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
      </CardContent>
      
      <CardFooter className="px-6 py-4 bg-secondary/40 border-t">
        <Button 
          className="w-full"
          variant={isSelected ? "outline" : "default"}
          onClick={() => onSelect(room)}
        >
          {isSelected ? "Remove Selection" : "Select Room"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
