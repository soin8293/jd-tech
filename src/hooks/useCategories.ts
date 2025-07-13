import { useState, useCallback, useEffect } from 'react';
import { TemplateCategory } from '@/types/template.types';

export const useCategories = () => {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default categories
  const defaultCategories: TemplateCategory[] = [
    {
      id: 'standard',
      name: 'Standard Rooms',
      description: 'Basic room configurations',
      defaultAmenities: ['Free Wi-Fi', 'TV', 'Air Conditioning'],
      priceRange: { min: 100, max: 200 },
      icon: 'bed',
      color: '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'premium',
      name: 'Premium Rooms',
      description: 'Enhanced room options with premium amenities',
      defaultAmenities: ['Free Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service'],
      priceRange: { min: 200, max: 400 },
      icon: 'crown',
      color: '#F59E0B',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'suite',
      name: 'Suites',
      description: 'Luxury suite configurations',
      defaultAmenities: ['Free Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Jacuzzi', 'City View'],
      priceRange: { min: 400, max: 800 },
      icon: 'star',
      color: '#8B5CF6',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      // For now, return default categories - can be enhanced with Firestore later
      setCategories(defaultCategories);
      setError(null);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData: Omit<TemplateCategory, 'id'>) => {
    setIsLoading(true);
    try {
      const newCategory: TemplateCategory = {
        ...categoryData,
        id: `category-${Date.now()}`,
      };
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (error) {
      setError('Failed to create category');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, categoryData: Partial<TemplateCategory>) => {
    setIsLoading(true);
    try {
      setCategories(prev => 
        prev.map(category => 
          category.id === id ? { ...category, ...categoryData } : category
        )
      );
    } catch (error) {
      setError('Failed to update category');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setCategories(prev => prev.filter(category => category.id !== id));
    } catch (error) {
      setError('Failed to delete category');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};