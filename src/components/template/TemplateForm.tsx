import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { RoomCategory, CreateTemplateData } from "@/types/template.types";

interface TemplateFormProps {
  categories: RoomCategory[];
  onSubmit: (data: CreateTemplateData) => void;
  onCancel: () => void;
  initialData?: Partial<CreateTemplateData>;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    categoryId: initialData?.categoryId || '',
    price: initialData?.price || 0,
    capacity: initialData?.capacity || 2,
    size: initialData?.size || 400,
    bed: initialData?.bed || 'Queen',
    amenities: initialData?.amenities || [],
    images: initialData?.images || []
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [newImage, setNewImage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const removeImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== image)
    }));
  };

  const bedTypes = ['Single', 'Double', 'Queen', 'King', 'Twin', 'Sofa Bed'];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Room Template</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Deluxe Ocean View"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the room template..."
                  rows={3}
                />
              </div>
            </div>

            {/* Room Specifications */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price per Night</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Guest Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Room Size (sq ft)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="bed">Bed Type</Label>
                  <Select
                    value={formData.bed}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bed: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {bedTypes.map((bedType) => (
                        <SelectItem key={bedType} value={bedType}>
                          {bedType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label>Amenities</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" onClick={addAmenity} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {amenity}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeAmenity(amenity)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <Label>Images (URLs)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="Add image URL..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              />
              <Button type="button" onClick={addImage} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="flex-1 text-sm truncate">{image}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(image)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Create Template
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};