import { useState, useCallback, useEffect } from 'react';
import { Room } from '@/types/hotel.types';
import { toast } from '@/hooks/use-toast';

export interface SearchFilters {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string[];
  availability?: boolean;
  bedType?: string;
  sortBy?: 'name' | 'price' | 'capacity' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface SavedFilterPreset {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  isDefault?: boolean;
}

const STORAGE_KEY = 'room-search-presets';

export const useAdvancedSearch = (rooms: Room[]) => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(rooms);
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load saved presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const presets = JSON.parse(stored).map((preset: any) => ({
          ...preset,
          createdAt: new Date(preset.createdAt)
        }));
        setSavedPresets(presets);
      }
    } catch (error) {
      console.error('Error loading saved presets:', error);
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = useCallback((presets: SavedFilterPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Error saving presets:', error);
    }
  }, []);

  // Apply filters to rooms
  const applyFilters = useCallback((filters: SearchFilters) => {
    setIsSearching(true);
    
    let filtered = [...rooms];

    // Text search across multiple fields
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(term) ||
        room.description.toLowerCase().includes(term) ||
        room.amenities.some(amenity => amenity.toLowerCase().includes(term)) ||
        room.bed.toLowerCase().includes(term)
      );
    }

    // Price range
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(room => room.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(room => room.price <= filters.maxPrice!);
    }

    // Capacity range
    if (filters.minCapacity !== undefined) {
      filtered = filtered.filter(room => room.capacity >= filters.minCapacity!);
    }
    if (filters.maxCapacity !== undefined) {
      filtered = filtered.filter(room => room.capacity <= filters.maxCapacity!);
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(room =>
        filters.amenities!.every(amenity =>
          room.amenities.some(roomAmenity =>
            roomAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      );
    }

    // Availability filter
    if (filters.availability !== undefined) {
      filtered = filtered.filter(room => room.availability === filters.availability);
    }

    // Bed type filter
    if (filters.bedType) {
      filtered = filtered.filter(room =>
        room.bed.toLowerCase().includes(filters.bedType!.toLowerCase())
      );
    }

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (filters.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'capacity':
            aValue = a.capacity;
            bValue = b.capacity;
            break;
          case 'size':
            aValue = a.size || 0;
            bValue = b.size || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    setFilteredRooms(filtered);
    setSearchFilters(filters);
    setIsSearching(false);
  }, [rooms]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...searchFilters, ...newFilters };
    applyFilters(updatedFilters);
  }, [searchFilters, applyFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchFilters({});
    setFilteredRooms(rooms);
  }, [rooms]);

  // Save current filters as preset
  const saveFilterPreset = useCallback((name: string, isDefault = false) => {
    if (!name.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please provide a name for the filter preset.",
        variant: "destructive",
      });
      return;
    }

    const newPreset: SavedFilterPreset = {
      id: `preset-${Date.now()}`,
      name: name.trim(),
      filters: { ...searchFilters },
      createdAt: new Date(),
      isDefault
    };

    let updatedPresets = [...savedPresets];
    
    // If this is set as default, remove default from others
    if (isDefault) {
      updatedPresets = updatedPresets.map(preset => ({
        ...preset,
        isDefault: false
      }));
    }

    updatedPresets.push(newPreset);
    setSavedPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);

    toast({
      title: "Preset Saved",
      description: `Filter preset "${name}" has been saved.`,
    });
  }, [searchFilters, savedPresets, savePresetsToStorage]);

  // Load filter preset
  const loadFilterPreset = useCallback((presetId: string) => {
    const preset = savedPresets.find(p => p.id === presetId);
    if (preset) {
      applyFilters(preset.filters);
      toast({
        title: "Preset Loaded",
        description: `Applied filter preset "${preset.name}".`,
      });
    }
  }, [savedPresets, applyFilters]);

  // Delete filter preset
  const deleteFilterPreset = useCallback((presetId: string) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);

    toast({
      title: "Preset Deleted",
      description: "Filter preset has been removed.",
    });
  }, [savedPresets, savePresetsToStorage]);

  // Load default preset on mount
  useEffect(() => {
    const defaultPreset = savedPresets.find(p => p.isDefault);
    if (defaultPreset && Object.keys(searchFilters).length === 0) {
      applyFilters(defaultPreset.filters);
    }
  }, [savedPresets, searchFilters, applyFilters]);

  // Update filtered rooms when source rooms change
  useEffect(() => {
    if (Object.keys(searchFilters).length > 0) {
      applyFilters(searchFilters);
    } else {
      setFilteredRooms(rooms);
    }
  }, [rooms, searchFilters, applyFilters]);

  return {
    // State
    searchFilters,
    filteredRooms,
    savedPresets,
    isSearching,
    hasActiveFilters: Object.keys(searchFilters).length > 0,
    
    // Actions
    updateFilters,
    clearFilters,
    applyFilters,
    
    // Presets
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset
  };
};