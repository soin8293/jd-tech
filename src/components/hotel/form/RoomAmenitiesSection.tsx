
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { validationSchemas } from "@/utils/inputValidation";
import { useInputSanitization } from "@/hooks/useInputSanitization";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [newAmenity, setNewAmenity] = useState('');
  const [error, setError] = useState('');
  const { sanitizeString } = useInputSanitization();

  const handleAdd = () => {
    if (!newAmenity.trim()) return;

    try {
      const sanitizedAmenity = sanitizeString(newAmenity.trim(), 'amenity');
      validationSchemas.amenity.parse(sanitizedAmenity);
      
      if (amenities.includes(sanitizedAmenity)) {
        setError('Amenity already exists');
        return;
      }

      if (amenities.length >= 20) {
        setError('Maximum 20 amenities allowed');
        return;
      }

      onAddAmenity(sanitizedAmenity);
      setNewAmenity('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid amenity name');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAmenity(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="space-y-3">
      <Label>Amenities (Optional)</Label>
      {amenities.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {amenity}
              <button
                onClick={() => onRemoveAmenity(amenity)}
                className="hover:bg-background/80 rounded-full"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No amenities added yet</p>
      )}
      <div className="flex gap-2">
        <Input
          value={newAmenity}
          onChange={handleInputChange}
          placeholder="Enter amenity (e.g., Free WiFi, Air Conditioning)"
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
      <p className="text-xs text-muted-foreground">
        Add amenities like WiFi, parking, breakfast, etc. Maximum 20 amenities.
      </p>
    </div>
  );
};

export default RoomAmenitiesSection;
