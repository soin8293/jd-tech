
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface RoomAmenitiesSectionProps {
  amenities: string[];
  onAddAmenity: (amenity: string) => void;
  onRemoveAmenity: (amenity: string) => void;
}

const RoomAmenitiesSection: React.FC<RoomAmenitiesSectionProps> = ({
  amenities,
  onAddAmenity,
  onRemoveAmenity,
}) => {
  const [newAmenity, setNewAmenity] = React.useState('');

  const handleAdd = () => {
    if (!newAmenity.trim()) return;
    onAddAmenity(newAmenity.trim());
    setNewAmenity('');
  };

  return (
    <div className="space-y-3">
      <Label>Amenities</Label>
      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="flex items-center gap-1 py-1"
          >
            {amenity}
            <button
              onClick={() => onRemoveAmenity(amenity)}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newAmenity}
          onChange={(e) => setNewAmenity(e.target.value)}
          placeholder="Add new amenity"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RoomAmenitiesSection;
