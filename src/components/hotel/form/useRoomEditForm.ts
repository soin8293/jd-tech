
import { useState } from "react";
import { RoomFormData } from "@/types/hotel.types";
import { useToast } from "@/hooks/use-toast";
import { useInputSanitization } from "@/hooks/useInputSanitization";
import { roomFormSchema } from "@/utils/inputValidation";

export const useRoomEditForm = (
  editingRoom: RoomFormData,
  onSave: (room: RoomFormData) => void
) => {
  const { toast } = useToast();
  const { sanitizeObject } = useInputSanitization();
  const [formData, setFormData] = useState<RoomFormData>(editingRoom);

  const handleFormChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleRemoveAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleRemoveImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== image)
    }));
  };

  const handleSave = () => {
    try {
      // Sanitize all string inputs
      const sanitizedData = sanitizeObject(formData, {
        name: 'string',
        description: 'html',
        bed: 'string'
      });

      // Create properly typed data object with all required fields
      const roomData: RoomFormData = {
        name: sanitizedData.name || formData.name,
        description: sanitizedData.description || formData.description,
        price: formData.price,
        capacity: formData.capacity,
        size: formData.size,
        bed: sanitizedData.bed || formData.bed,
        amenities: formData.amenities, // Already sanitized in component
        images: formData.images, // Already validated in component
        availability: formData.availability
      };

      // Validate the entire form
      const validatedData = roomFormSchema.parse(roomData);
      
      onSave(validatedData);
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Please check your input and try again.",
        variant: "destructive",
      });
    }
  };

  return {
    formData,
    handleFormChange,
    handleSwitchChange,
    handleAddAmenity,
    handleAddImage,
    handleRemoveAmenity,
    handleRemoveImage,
    handleSave,
  };
};
