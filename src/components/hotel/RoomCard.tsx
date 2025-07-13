import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Room, BookingPeriod, RoomAvailabilityCheck } from "@/types/hotel.types";
import { 
  Edit, 
  Trash2, 
  Users, 
  Bed, 
  Wifi, 
  Car, 
  Coffee, 
  Tv, 
  Wind,
  Star,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ImageIcon,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: Room;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBook?: () => void;
  bookingPeriod?: BookingPeriod;
  context?: "booking" | "room-management";
  showEditButtons?: boolean;
  availability?: RoomAvailabilityCheck;
  isLoading?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onBook,
  bookingPeriod,
  context = "booking",
  showEditButtons = false,
  availability,
  isLoading = false,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Enhanced amenity icons mapping
  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return Wifi;
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('garage')) return Car;
    if (lowerAmenity.includes('coffee') || lowerAmenity.includes('breakfast')) return Coffee;
    if (lowerAmenity.includes('tv') || lowerAmenity.includes('television')) return Tv;
    if (lowerAmenity.includes('air') || lowerAmenity.includes('conditioning')) return Wind;
    if (lowerAmenity.includes('bed') || lowerAmenity.includes('bedroom')) return Bed;
    return Star; // Default icon
  };

  // Enhanced availability status
  const getAvailabilityStatus = () => {
    if (!availability) {
      return room.availability ? 
        { status: 'available', color: 'text-green-600', icon: CheckCircle, label: 'Available' } :
        { status: 'unavailable', color: 'text-red-600', icon: XCircle, label: 'Unavailable' };
    }
    
    if (availability.isAvailable) {
      return { status: 'available', color: 'text-green-600', icon: CheckCircle, label: 'Available' };
    } else if (availability.nextAvailableTime) {
      return { status: 'partial', color: 'text-yellow-600', icon: Clock, label: 'Partial Availability' };
    } else {
      return { status: 'unavailable', color: 'text-red-600', icon: XCircle, label: 'Unavailable' };
    }
  };

  const availabilityStatus = getAvailabilityStatus();
  const StatusIcon = availabilityStatus.icon;

  // Primary image with fallback
  const primaryImage = room.images && room.images.length > 0 ? room.images[0] : null;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:scale-105 hover-scale",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isLoading && "opacity-50 pointer-events-none",
        "animate-fade-in"
      )}
    >
      {/* Favorite Button */}
      {onToggleFavorite && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-2 right-2 z-10 h-8 w-8 p-0",
            "bg-white/80 backdrop-blur-sm hover:bg-white/90",
            isFavorite && "text-red-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>
      )}

      {/* Enhanced Image Section */}
      <div className="relative h-48 overflow-hidden">
        {primaryImage ? (
          <>
            <img 
              src={primaryImage} 
              alt={room.name}
              className={cn(
                "w-full h-full object-cover transition-all duration-300",
                "group-hover:scale-110",
                imageLoading && "opacity-0",
                imageError && "hidden"
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            {imageLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">No image available</span>
          </div>
        )}
        
        {/* Image overlay with additional info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Room status indicator */}
        <div className="absolute top-2 left-2">
          <Badge 
            variant={availabilityStatus.status === 'available' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {availabilityStatus.label}
          </Badge>
        </div>

        {/* Additional images indicator */}
        {room.images && room.images.length > 1 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-xs">
              +{room.images.length - 1} more
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        {/* Room Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1 line-clamp-1">{room.name}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{room.description}</p>
          </div>
        </div>

        {/* Room Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{room.capacity} guests</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{room.bed}</span>
          </div>
          {room.size && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{room.size} sqft</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-2xl text-primary">${room.price}</span>
            <span className="text-muted-foreground">/night</span>
          </div>
        </div>

        {/* Enhanced Amenities */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 6).map((amenity) => {
              const AmenityIcon = getAmenityIcon(amenity);
              return (
                <div 
                  key={amenity} 
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs"
                  title={amenity}
                >
                  <AmenityIcon className="h-3 w-3" />
                  <span className="truncate max-w-20">{amenity}</span>
                </div>
              );
            })}
            {room.amenities.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{room.amenities.length - 6} more
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {context === "booking" && onSelect && (
            <Button 
              variant={isSelected ? "default" : "outline"} 
              className="flex-1"
              onClick={onSelect}
              disabled={!availabilityStatus || availabilityStatus.status === 'unavailable'}
            >
              {isSelected ? "Selected" : "Select Room"}
            </Button>
          )}
          
          {context === "booking" && onBook && (
            <Button 
              onClick={onBook}
              disabled={!availabilityStatus || availabilityStatus.status === 'unavailable'}
              className="flex-1"
            >
              Book Now
            </Button>
          )}
          
          {showEditButtons && context === "room-management" && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Additional booking info */}
        {bookingPeriod && context === "booking" && (
          <div className="mt-3 p-2 bg-muted rounded-md text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Check-in: {String(bookingPeriod.checkIn)}</span>
              <span>Check-out: {String(bookingPeriod.checkOut)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
