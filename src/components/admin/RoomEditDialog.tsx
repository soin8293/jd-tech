import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import RoomImagesSection from '@/components/hotel/form/RoomImagesSection';
import SimpleRoomAmenitiesSection from '@/components/hotel/form/SimpleRoomAmenitiesSection';
import { useRoomMutations } from '@/hooks/useRoomMutations';
import { Room } from '@/types/hotel.types';
import { useToast } from '@/hooks/use-toast';

interface RoomEditDialogProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  isCreating?: boolean;
}

export const RoomEditDialog: React.FC<RoomEditDialogProps> = ({
  room,
  isOpen,
  onClose,
  isCreating = false
}) => {
  const [formData, setFormData] = useState<Partial<Room>>(room);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const { updateRoom, isLoading } = useRoomMutations();
  const { toast } = useToast();

  useEffect(() => {
    setFormData(room);
    setImagesToDelete([]);
  }, [room]);

  const handleInputChange = (field: keyof Room, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), imageUrl]
    }));
  };

  const handleRemoveImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter(img => img !== imageUrl)
    }));
    
    // Track for deletion from storage
    if (!isCreating && room.images?.includes(imageUrl)) {
      setImagesToDelete(prev => [...prev, imageUrl]);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.description || !formData.price) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (isCreating) {
        // For new rooms, we need to create via the existing room service
        // This will be handled by the room management hook
        toast({
          title: "Info",
          description: "New room creation will be implemented with the existing room service",
        });
      } else {
        await updateRoom(room.id!, formData, imagesToDelete);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isCreating ? 'Create New Room' : 'Edit Room'}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter room name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Night *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Guests)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => handleInputChange('capacity', Number(e.target.value))}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size (sq ft)</Label>
              <Input
                id="size"
                type="number"
                value={formData.size || ''}
                onChange={(e) => handleInputChange('size', Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bed">Bed Type</Label>
              <Input
                id="bed"
                value={formData.bed || ''}
                onChange={(e) => handleInputChange('bed', e.target.value)}
                placeholder="e.g., King, Queen, Twin"
              />
            </div>

            <div className="space-y-2 flex items-center gap-3">
              <Label htmlFor="availability">Available for Booking</Label>
              <Switch
                id="availability"
                checked={formData.availability ?? true}
                onCheckedChange={(checked) => handleInputChange('availability', checked)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter room description"
              rows={4}
            />
          </div>

          {/* Amenities */}
          <SimpleRoomAmenitiesSection
            amenities={formData.amenities || []}
            onAddAmenity={(amenity) => handleInputChange('amenities', [...(formData.amenities || []), amenity])}
            onRemoveAmenity={(amenity) => handleInputChange('amenities', (formData.amenities || []).filter(a => a !== amenity))}
          />

          {/* Images */}
          <RoomImagesSection
            images={formData.images || []}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            roomId={room.id || 'new'}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : (isCreating ? 'Create Room' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};