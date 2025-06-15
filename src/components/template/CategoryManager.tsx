import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, X } from "lucide-react";
import { RoomCategory, CreateCategoryData } from "@/types/template.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CategoryManagerProps {
  categories: RoomCategory[];
  isLoading: boolean;
  onCreateCategory: (data: CreateCategoryData) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<RoomCategory>) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  isLoading,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);

  const handleCreateCategory = (data: CreateCategoryData) => {
    onCreateCategory(data);
    setShowCreateForm(false);
  };

  const handleUpdateCategory = (updates: Partial<RoomCategory>) => {
    if (editingCategory) {
      onUpdateCategory(editingCategory.id, updates);
      setEditingCategory(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Room Categories</h3>
          <p className="text-sm text-muted-foreground">
            Organize templates into categories for better management
          </p>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border shadow-lg">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new room category to organize your templates
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              onSubmit={handleCreateCategory}
              onCancel={() => setShowCreateForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No Categories Found</CardTitle>
            <CardDescription>
              Create your first category to organize room templates.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </div>
                  
                  <div className="flex gap-1">
                    <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => {
                      if (!open) setEditingCategory(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-background border shadow-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Category</DialogTitle>
                          <DialogDescription>
                            Update category information
                          </DialogDescription>
                        </DialogHeader>
                        <CategoryForm
                          initialData={category}
                          onSubmit={handleUpdateCategory}
                          onCancel={() => setEditingCategory(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Price Range: </span>
                    ${category.priceRange.min} - ${category.priceRange.max}
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium mb-2 block">Default Amenities:</span>
                    <div className="flex flex-wrap gap-1">
                      {category.defaultAmenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {category.defaultAmenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.defaultAmenities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingCategory && (
        <Dialog open={true} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent className="bg-background border shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update category information
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              initialData={editingCategory}
              onSubmit={handleUpdateCategory}
              onCancel={() => setEditingCategory(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Category Form Component
interface CategoryFormProps {
  initialData?: Partial<RoomCategory>;
  onSubmit: (data: CreateCategoryData) => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    defaultAmenities: initialData?.defaultAmenities || [],
    priceRange: initialData?.priceRange || { min: 0, max: 1000 },
    icon: initialData?.icon || 'bed',
    color: initialData?.color || '#6b7280'
  });

  const [newAmenity, setNewAmenity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.defaultAmenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        defaultAmenities: [...prev.defaultAmenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      defaultAmenities: prev.defaultAmenities.filter(a => a !== amenity)
    }));
  };

  const colorOptions = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Standard, Deluxe, Suite"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this category..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minPrice">Min Price</Label>
          <Input
            id="minPrice"
            type="number"
            value={formData.priceRange.min}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              priceRange: { ...prev.priceRange, min: parseFloat(e.target.value) || 0 }
            }))}
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <Label htmlFor="maxPrice">Max Price</Label>
          <Input
            id="maxPrice"
            type="number"
            value={formData.priceRange.max}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              priceRange: { ...prev.priceRange, max: parseFloat(e.target.value) || 0 }
            }))}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <Label>Category Color</Label>
        <div className="flex gap-2 mt-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded border-2 ${
                formData.color === color ? 'border-foreground' : 'border-muted'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Default Amenities</Label>
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
          {formData.defaultAmenities.map((amenity, index) => (
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

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? 'Update' : 'Create'} Category
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};