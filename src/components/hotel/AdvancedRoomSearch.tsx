import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  X, 
  Save, 
  Bookmark, 
  Trash2,
  SortAsc,
  SortDesc,
  Star
} from "lucide-react";
import { SearchFilters, SavedFilterPreset, useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { Room } from "@/types/hotel.types";

interface AdvancedRoomSearchProps {
  rooms: Room[];
  onFilteredRoomsChange: (rooms: Room[]) => void;
  className?: string;
}

export const AdvancedRoomSearch: React.FC<AdvancedRoomSearchProps> = ({
  rooms,
  onFilteredRoomsChange,
  className = ""
}) => {
  const {
    searchFilters,
    filteredRooms,
    savedPresets,
    isSearching,
    hasActiveFilters,
    updateFilters,
    clearFilters,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset
  } = useAdvancedSearch(rooms);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');

  // Update parent component when filtered rooms change
  React.useEffect(() => {
    onFilteredRoomsChange(filteredRooms);
  }, [filteredRooms, onFilteredRoomsChange]);

  const handleSavePreset = () => {
    saveFilterPreset(presetName, makeDefault);
    setPresetName('');
    setMakeDefault(false);
    setShowSaveDialog(false);
  };

  const addAmenityFilter = () => {
    if (newAmenity.trim()) {
      const currentAmenities = searchFilters.amenities || [];
      if (!currentAmenities.includes(newAmenity.trim())) {
        updateFilters({
          amenities: [...currentAmenities, newAmenity.trim()]
        });
      }
      setNewAmenity('');
    }
  };

  const removeAmenityFilter = (amenity: string) => {
    const updatedAmenities = (searchFilters.amenities || []).filter(a => a !== amenity);
    updateFilters({
      amenities: updatedAmenities.length > 0 ? updatedAmenities : undefined
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms by name, description, amenities..."
                value={searchFilters.searchTerm || ''}
                onChange={(e) => updateFilters({ searchTerm: e.target.value || undefined })}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters {hasActiveFilters && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">!</Badge>}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
            <span>
              {isSearching ? 'Searching...' : `${filteredRooms.length} of ${rooms.length} rooms`}
            </span>
            {hasActiveFilters && (
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Save className="h-3 w-3" />
                    Save Filters
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Filter Preset</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="preset-name">Preset Name</Label>
                      <Input
                        id="preset-name"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="e.g., Budget Rooms, Large Suites"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="make-default"
                        checked={makeDefault}
                        onCheckedChange={setMakeDefault}
                      />
                      <Label htmlFor="make-default">Set as default filter</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                        Save Preset
                      </Button>
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {savedPresets.map(preset => (
                <div key={preset.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadFilterPreset(preset.id)}
                    className="gap-1"
                  >
                    {preset.isDefault && <Star className="h-3 w-3 fill-current" />}
                    {preset.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFilterPreset(preset.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={searchFilters.minPrice || ''}
                    onChange={(e) => updateFilters({ 
                      minPrice: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={searchFilters.maxPrice || ''}
                    onChange={(e) => updateFilters({ 
                      maxPrice: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>

              {/* Capacity Range */}
              <div className="space-y-2">
                <Label>Guest Capacity</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={searchFilters.minCapacity || ''}
                    onChange={(e) => updateFilters({ 
                      minCapacity: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={searchFilters.maxCapacity || ''}
                    onChange={(e) => updateFilters({ 
                      maxCapacity: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>

              {/* Bed Type */}
              <div className="space-y-2">
                <Label>Bed Type</Label>
                <Select
                  value={searchFilters.bedType || ''}
                  onValueChange={(value) => updateFilters({ bedType: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any bed type</SelectItem>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Double">Double</SelectItem>
                    <SelectItem value="Queen">Queen</SelectItem>
                    <SelectItem value="King">King</SelectItem>
                    <SelectItem value="Twin">Twin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={searchFilters.sortBy || ''}
                  onValueChange={(value) => updateFilters({ 
                    sortBy: value as SearchFilters['sortBy'] || undefined 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default order</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="capacity">Capacity</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <div className="flex gap-2">
                  <Button
                    variant={searchFilters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ sortOrder: 'asc' })}
                    className="flex-1 gap-1"
                  >
                    <SortAsc className="h-3 w-3" />
                    Ascending
                  </Button>
                  <Button
                    variant={searchFilters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ sortOrder: 'desc' })}
                    className="flex-1 gap-1"
                  >
                    <SortDesc className="h-3 w-3" />
                    Descending
                  </Button>
                </div>
              </div>
            </div>

            {/* Amenities Filter */}
            <div className="space-y-2">
              <Label>Required Amenities</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add amenity filter..."
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenityFilter())}
                />
                <Button onClick={addAmenityFilter} size="sm">
                  Add
                </Button>
              </div>
              {searchFilters.amenities && searchFilters.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {searchFilters.amenities.map((amenity, index) => (
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

            {/* Availability Filter */}
            <div className="flex items-center space-x-2">
              <Switch
                id="availability-filter"
                checked={searchFilters.availability === true}
                onCheckedChange={(checked) => updateFilters({ 
                  availability: checked ? true : undefined 
                })}
              />
              <Label htmlFor="availability-filter">Only show available rooms</Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};