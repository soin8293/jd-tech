
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Check, Loader2 } from "lucide-react";
import { RoomFormData } from "@/types/hotel.types";

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
  const [formData, setFormData] = useState<RoomFormData>(editingRoom);
  const [newAmenity, setNewAmenity] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

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

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    
    if (!formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
    }
    setNewAmenity('');
  };

  const handleRemoveAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    
    if (!formData.images.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
    }
    setNewImageUrl('');
  };

  const handleRemoveImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== image)
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAdding ? "Add New Room" : "Edit Room"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name*</Label>
            <Input 
              id="name" 
              name="name"
              value={formData.name} 
              onChange={handleFormChange}
              placeholder="Deluxe Room"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Price per Night (USD)*</Label>
            <Input 
              id="price" 
              name="price"
              type="number"
              value={formData.price} 
              onChange={handleFormChange}
              placeholder="300"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            name="description"
            value={formData.description} 
            onChange={handleFormChange}
            placeholder="Elegant and spacious room with premium amenities..."
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capacity">Max Guests</Label>
            <Input 
              id="capacity" 
              name="capacity"
              type="number"
              value={formData.capacity} 
              onChange={handleFormChange}
              placeholder="2"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="size">Size (sq ft)</Label>
            <Input 
              id="size" 
              name="size"
              type="number"
              value={formData.size} 
              onChange={handleFormChange}
              placeholder="400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bed">Bed Type</Label>
            <Input 
              id="bed" 
              name="bed"
              value={formData.bed} 
              onChange={handleFormChange}
              placeholder="King"
            />
          </div>
        </div>
        
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
        
        <Separator />
        
        <div className="space-y-3">
          <Label>Amenities</Label>
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map((amenity, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="flex items-center gap-1 py-1"
              >
                {amenity}
                <button
                  onClick={() => handleRemoveAmenity(amenity)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Add new amenity"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAmenity();
                }
              }}
            />
            <Button 
              type="button" 
              onClick={handleAddAmenity}
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <Label>Images*</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group rounded-md overflow-hidden h-24">
                <img 
                  src={image} 
                  alt={`Room preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(image)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter image URL"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddImage();
                }
              }}
            />
            <Button 
              type="button" 
              onClick={handleAddImage}
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add URLs for room images. At least one image is required.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
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
