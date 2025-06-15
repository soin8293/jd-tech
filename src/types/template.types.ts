export interface RoomCategory {
  id: string;
  name: string;
  description: string;
  defaultAmenities: string[];
  priceRange: {
    min: number;
    max: number;
  };
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category?: RoomCategory;
  
  // Room specifications
  price: number;
  capacity: number;
  size: number;
  bed: string;
  amenities: string[];
  images: string[];
  
  // Template metadata
  version: number;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateData {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  capacity: number;
  size: number;
  bed: string;
  amenities: string[];
  images: string[];
}

export interface CreateCategoryData {
  name: string;
  description: string;
  defaultAmenities: string[];
  priceRange: {
    min: number;
    max: number;
  };
  icon: string;
  color: string;
}

export interface TemplateFilters {
  categoryId?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  capacity?: number;
  amenities?: string[];
  searchTerm?: string;
}

export interface BulkTemplateOperation {
  type: 'update_price' | 'update_amenities' | 'change_category' | 'toggle_active';
  templateIds: string[];
  data: any;
}