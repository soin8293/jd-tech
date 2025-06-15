import { useState, useCallback, useEffect } from 'react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '@/services/template/templateService';
import { RoomCategory, CreateCategoryData } from '@/types/template.types';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface CategoryState {
  categories: RoomCategory[];
  isLoading: boolean;
  error: string | null;
}

export const useCategories = () => {
  const [state, setState] = useState<CategoryState>({
    categories: [],
    isLoading: false,
    error: null
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const categories = await getCategories();
      setState(prev => ({ 
        ...prev, 
        categories, 
        isLoading: false 
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch categories';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      toast({
        title: "Error Loading Categories",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  // Create new category
  const createNewCategory = useCallback(async (
    data: CreateCategoryData
  ): Promise<RoomCategory | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const newCategory = await createCategory(data);
      
      setState(prev => ({ 
        ...prev, 
        categories: [...prev.categories, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false 
      }));

      toast({
        title: "Category Created",
        description: `Category "${newCategory.name}" has been created successfully.`,
      });

      return newCategory;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create category';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, []);

  // Update category
  const updateExistingCategory = useCallback(async (
    categoryId: string, 
    updates: Partial<RoomCategory>
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await updateCategory(categoryId, updates);
      
      setState(prev => ({ 
        ...prev, 
        categories: prev.categories.map(category =>
          category.id === categoryId 
            ? { ...category, ...updates, updatedAt: new Date() }
            : category
        ).sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false 
      }));

      toast({
        title: "Category Updated",
        description: "Category has been updated successfully.",
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update category';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, []);

  // Delete category
  const deleteExistingCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await deleteCategory(categoryId);
      
      setState(prev => ({ 
        ...prev, 
        categories: prev.categories.filter(category => category.id !== categoryId),
        isLoading: false 
      }));

      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete category';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, []);

  // Get category by ID
  const getCategoryById = useCallback((categoryId: string): RoomCategory | undefined => {
    return state.categories.find(category => category.id === categoryId);
  }, [state.categories]);

  // Get default amenities for category
  const getDefaultAmenities = useCallback((categoryId: string): string[] => {
    const category = getCategoryById(categoryId);
    return category?.defaultAmenities || [];
  }, [getCategoryById]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    // State
    categories: state.categories,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    fetchCategories,
    createCategory: createNewCategory,
    updateCategory: updateExistingCategory,
    deleteCategory: deleteExistingCategory,
    getCategoryById,
    getDefaultAmenities
  };
};