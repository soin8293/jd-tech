
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
  const { sanitizeString } = useInputSanitization();
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
      // Sanitize string inputs individually to maintain type safety
      const sanitizedName = sanitizeString(formData.name || '', 'name');
      const sanitizedDescription = sanitizeString(formData.description || '', 'description');
      const sanitizedBed = sanitizeString(formData.bed || '', 'bed');

      // Validate required fields before creating the object
      if (!sanitizedName || sanitizedName.trim() === '') {
        throw new Error('Room name is required');
      }
      if (!formData.price || formData.price <= 0) {
        throw new Error('Valid room price is required');
      }
      if (!formData.capacity || formData.capacity <= 0) {
        throw new Error('Valid room capacity is required');
      }
      if (!sanitizedBed || sanitizedBed.trim() === '') {
        throw new Error('Bed type is required');
      }

      // Create the data object with explicit type assertion after validation
      const roomData = {
        id: formData.id,
        name: sanitizedName,
        description: sanitizedDescription,
        price: formData.price,
        capacity: formData.capacity,
        size: formData.size ?? 0,
        bed: sanitizedBed,
        amenities: formData.amenities ?? [],
        images: formData.images ?? [],
        availability: formData.availability ?? true
      } as RoomFormData;

      // Now validate with schema
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
