import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SimpleRoomAmenitiesSectionProps {
  amenities: string[];
  onAddAmenity: (amenity: string) => void;
  onRemoveAmenity: (amenity: string) => void;
}

const SimpleRoomAmenitiesSection: React.FC<SimpleRoomAmenitiesSectionProps> = ({
  amenities,
  onAddAmenity,
  onRemoveAmenity,
}) => {
  const [newAmenity, setNewAmenity] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!newAmenity.trim()) return;

    // Basic validation
    if (newAmenity.length > 50) {
      setError('Amenity name must be less than 50 characters');
      return;
    }

    if (amenities.includes(newAmenity.trim())) {
      setError('This amenity already exists');
      return;
    }

    onAddAmenity(newAmenity.trim());
    setNewAmenity('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <Label>Amenities</Label>
      
      <div className="flex gap-2">
        <Input
          placeholder="Add amenity (e.g., WiFi, Pool, Gym)"
          value={newAmenity}
          onChange={(e) => {
            setNewAmenity(e.target.value);
            if (error) setError('');
          }}
          onKeyPress={handleKeyPress}
          className={error ? 'border-destructive' : ''}
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          size="sm"
          disabled={!newAmenity.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {amenity}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => onRemoveAmenity(amenity)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default SimpleRoomAmenitiesSection;