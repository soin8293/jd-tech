import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";

interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  amenities?: string[];
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

const amenityOptions = [
  "WiFi", "Air Conditioning", "TV", "Mini Bar", "Balcony", 
  "Ocean View", "Pool Access", "Gym Access", "Room Service", "Parking"
];

const presetFilters = [
  { name: "Budget", filters: { maxPrice: 100 } },
  { name: "Luxury", filters: { minPrice: 200 } },
  { name: "Family", filters: { capacity: 4 } },
  { name: "Romantic", filters: { amenities: ["Balcony", "Ocean View"] } },
];

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  onFiltersChange,
  isLoading = false
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([50, 500]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const applyFilters = () => {
    const newFilters: SearchFilters = {
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setPriceRange([50, 500]);
    setSelectedAmenities([]);
    setFilters({});
    onFiltersChange({});
  };

  const applyPreset = (preset: typeof presetFilters[0]) => {
    const newFilters = { ...preset.filters };
    if (newFilters.amenities) {
      setSelectedAmenities(newFilters.amenities);
    }
    if (newFilters.minPrice || newFilters.maxPrice) {
      setPriceRange([
        newFilters.minPrice || 50,
        newFilters.maxPrice || 500
      ]);
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Filters */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            {presetFilters.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                disabled={isLoading}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Price Range: ${priceRange[0]} - ${priceRange[1]} per night
          </Label>
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={500}
            min={50}
            step={10}
            className="w-full"
          />
        </div>

        {/* Amenities */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Amenities</Label>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((amenity) => (
              <Badge
                key={amenity}
                variant={selectedAmenities.includes(amenity) ? "default" : "secondary"}
                className="cursor-pointer hover:opacity-80"
                onClick={() => toggleAmenity(amenity)}
              >
                {amenity}
                {selectedAmenities.includes(amenity) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={applyFilters} disabled={isLoading} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
            Clear All
          </Button>
        </div>

        {/* Active Filters Display */}
        {Object.keys(filters).length > 0 && (
          <div className="pt-2 border-t">
            <Label className="text-sm font-medium mb-2 block">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.minPrice && (
                <Badge variant="outline">Min: ${filters.minPrice}</Badge>
              )}
              {filters.maxPrice && (
                <Badge variant="outline">Max: ${filters.maxPrice}</Badge>
              )}
              {filters.amenities?.map((amenity) => (
                <Badge key={amenity} variant="outline">{amenity}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSearchFilters;