
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { RoomFormData } from "@/types/hotel.types";
import RoomDetailsSection from "./form/RoomDetailsSection";
import RoomAmenitiesSection from "./form/RoomAmenitiesSection";
import RoomImagesSection from "./form/RoomImagesSection";
import RoomAvailabilityToggle from "./form/RoomAvailabilityToggle";
import { useRoomEditForm } from "./form/useRoomEditForm";

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
  const {
    formData,
    handleFormChange,
    handleSwitchChange,
    handleAddAmenity,
    handleAddImage,
    handleRemoveAmenity,
    handleRemoveImage,
    handleSave,
  } = useRoomEditForm(editingRoom, onSave);

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
        
        <RoomAvailabilityToggle 
          availability={formData.availability}
          onToggle={handleSwitchChange}
        />
        
        <RoomAmenitiesSection
          amenities={formData.amenities}
          onAddAmenity={handleAddAmenity}
          onRemoveAmenity={handleRemoveAmenity}
        />
        
        <RoomImagesSection
          images={formData.images}
          onAddImage={handleAddImage}
          onRemoveImage={handleRemoveImage}
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
