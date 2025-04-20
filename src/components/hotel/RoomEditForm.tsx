
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";
import { RoomFormData } from "@/types/hotel.types";
import RoomDetailsSection from "./form/RoomDetailsSection";
import RoomAmenitiesSection from "./form/RoomAmenitiesSection";
import RoomImagesSection from "./form/RoomImagesSection";
import { useToast } from "@/hooks/use-toast";

interface RoomEditFormProps {
  editingRoom: RoomFormData;
  isAdding: boolean;
  isLoading?: boolean;
  onSave: (room: RoomFormData) => void;
  onCancel: () => void;
}

const RoomEditForm: React.FC<RoomEditFormProps> = ({
  editingRoom,
  isAdding,
  isLoading,
  onSave,
  onCancel,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<RoomFormData>(editingRoom);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, availability: checked }));
  };

  const handleAddAmenity = (amenity: string) => {
    if (!formData.amenities.includes(amenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }));
    }
  };

  const handleAddImage = (imageUrl: string) => {
    if (!formData.images.includes(imageUrl)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
    }
  };

  const handleSave = () => {
    // Remove the check for images
    if (!formData.name || !formData.price) {
      toast({
        title: "Missing information",
        description: "Please fill in the room name and price.",
        variant: "destructive",
      });
      return;
    }
    
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAdding ? "Add New Room" : "Edit Room"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoomDetailsSection
          name={formData.name}
          description={formData.description}
          price={formData.price}
          capacity={formData.capacity}
          size={formData.size}
          bed={formData.bed}
          onChange={handleFormChange}
        />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Availability</Label>
            <Switch 
              checked={formData.availability}
              onCheckedChange={handleSwitchChange}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {formData.availability 
              ? "This room is available for booking"
              : "This room is not available for booking"
            }
          </p>
        </div>
        
        <RoomAmenitiesSection
          amenities={formData.amenities}
          onAddAmenity={handleAddAmenity}
          onRemoveAmenity={(amenity) => 
            setFormData(prev => ({
              ...prev,
              amenities: prev.amenities.filter(a => a !== amenity)
            }))
          }
        />
        
        <RoomImagesSection
          images={formData.images}
          onAddImage={handleAddImage}
          onRemoveImage={(image) => 
            setFormData(prev => ({
              ...prev,
              images: prev.images.filter(img => img !== image)
            }))
          }
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          className="gap-1"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isAdding ? "Add Room" : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomEditForm;
