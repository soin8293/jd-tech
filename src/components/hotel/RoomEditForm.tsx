
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RoomFormData } from "@/types/hotel.types";
import RoomDetailsSection from "./form/RoomDetailsSection";
import RoomAmenitiesSection from "./form/RoomAmenitiesSection";
import RoomImagesSection from "./form/RoomImagesSection";
import RoomAvailabilityToggle from "./form/RoomAvailabilityToggle";
import EnhancedS

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
          roomId={formData.id || 'temp'}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <EnhancedSaveButton
          onClick={handleSave}
          isLoading={isLoading}
          isAdding={isAdding}
        />
      </CardFooter>
    </Card>
  );
};

export default RoomEditForm;
