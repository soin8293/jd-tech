
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

      // Create properly typed data object - all required fields are guaranteed at this point
      const roomData: RoomFormData = {
        id: formData.id,
        name: sanitizedName, // guaranteed non-empty string
        description: sanitizedDescription, // sanitized string (can be empty)
        price: formData.price, // guaranteed positive number
        capacity: formData.capacity, // guaranteed positive number
        size: formData.size ?? 0, // number with fallback
        bed: sanitizedBed, // guaranteed non-empty string
        amenities: formData.amenities ?? [], // array with fallback
        images: formData.images ?? [], // array with fallback
        availability: formData.availability ?? true // boolean with fallback
      };

      // Now validate with schema - all required fields are present and properly typed
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
