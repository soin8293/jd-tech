import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter } from "lucide-react";
import { RoomCategory, TemplateFilters as TemplateFiltersType } from "@/types/template.types";

interface TemplateFiltersProps {
  categories: RoomCategory[];
  onFiltersChange: (filters: TemplateFiltersType) => void;
  onClearFilters: () => void;
  activeFilters: TemplateFiltersType;
}

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  categories,
  onFiltersChange,
  onClearFilters,
  activeFilters
}) => {
  const [localFilters, setLocalFilters] = useState<TemplateFiltersType>(activeFilters);
  const [newAmenity, setNewAmenity] = useState('');

  const handleFilterChange = (key: keyof TemplateFiltersType, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    const currentRange = localFilters.priceRange || { min: 0, max: 1000 };
    const newRange = { ...currentRange, [type]: numValue };
    handleFilterChange('priceRange', newRange);
  };

  const addAmenityFilter = () => {
    if (newAmenity.trim() && !(localFilters.amenities || []).includes(newAmenity.trim())) {
      const newAmenities = [...(localFilters.amenities || []), newAmenity.trim()];
      handleFilterChange('amenities', newAmenities);
      setNewAmenity('');
    }
  };

  const removeAmenityFilter = (amenity: string) => {
    const newAmenities = (localFilters.amenities || []).filter(a => a !== amenity);
    handleFilterChange('amenities', newAmenities.length > 0 ? newAmenities : undefined);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-medium">Filters</h3>
            {hasActiveFilters && (
              <Badge variant="secondary">
                {Object.keys(localFilters).length} active
              </Badge>
            )}
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search Templates</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or description..."
                value={localFilters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value || undefined)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={localFilters.categoryId || ''}
              onValueChange={(value) => handleFilterChange('categoryId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <Label>Price Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={localFilters.priceRange?.min || ''}
                onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                min="0"
                step="0.01"
              />
              <Input
                type="number"
                placeholder="Max"
                value={localFilters.priceRange?.max || ''}
                onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <Label htmlFor="capacity">Min Capacity</Label>
            <Select
              value={localFilters.capacity?.toString() || ''}
              onValueChange={(value) => handleFilterChange('capacity', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any capacity" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="">Any Capacity</SelectItem>
                <SelectItem value="1">1+ guests</SelectItem>
                <SelectItem value="2">2+ guests</SelectItem>
                <SelectItem value="4">4+ guests</SelectItem>
                <SelectItem value="6">6+ guests</SelectItem>
                <SelectItem value="8">8+ guests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amenities Filter */}
        <div className="mt-4">
          <Label>Amenities</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Filter by amenity..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenityFilter())}
            />
            <Button type="button" onClick={addAmenityFilter} size="sm">
              Add Filter
            </Button>
          </div>
          
          {localFilters.amenities && localFilters.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localFilters.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {amenity}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeAmenityFilter(amenity)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <strong>Active filters:</strong>
              {localFilters.searchTerm && ` Search: "${localFilters.searchTerm}"`}
              {localFilters.categoryId && ` Category: ${categories.find(c => c.id === localFilters.categoryId)?.name}`}
              {localFilters.priceRange && ` Price: $${localFilters.priceRange.min}-$${localFilters.priceRange.max}`}
              {localFilters.capacity && ` Min Capacity: ${localFilters.capacity}`}
              {localFilters.amenities && ` Amenities: ${localFilters.amenities.length}`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};