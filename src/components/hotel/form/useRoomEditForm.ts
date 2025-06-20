
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

      // Create properly typed data object with all required fields guaranteed
      const roomData: RoomFormData = {
        id: formData.id,
        name: (sanitizedData.name as string) || formData.name,
        description: (sanitizedData.description as string) || formData.description,
        price: formData.price,
        capacity: formData.capacity,
        size: formData.size,
        bed: (sanitizedData.bed as string) || formData.bed,
        amenities: formData.amenities,
        images: formData.images,
        availability: formData.availability
      };

      // Ensure all required fields are present and valid
      if (!roomData.name || roomData.name.trim() === '') {
        throw new Error('Room name is required');
      }
      if (!roomData.price || roomData.price <= 0) {
        throw new Error('Valid room price is required');
      }
      if (!roomData.capacity || roomData.capacity <= 0) {
        throw new Error('Valid room capacity is required');
      }
      if (!roomData.bed || roomData.bed.trim() === '') {
        throw new Error('Bed type is required');
      }

      // Now validate with schema - all required fields are guaranteed to be defined
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
