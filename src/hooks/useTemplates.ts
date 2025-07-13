import { useState, useCallback, useEffect } from 'react';
import { RoomTemplate } from '@/types/template.types';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<RoomTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      // For now, return empty array - can be enhanced with Firestore later
      setTemplates([]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (templateData: Omit<RoomTemplate, 'id'>) => {
    setIsLoading(true);
    try {
      const newTemplate: RoomTemplate = {
        ...templateData,
        id: `template-${Date.now()}`,
      };
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (error) {
      setError('Failed to create template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, templateData: Partial<RoomTemplate>) => {
    setIsLoading(true);
    try {
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? { ...template, ...templateData } : template
        )
      );
    } catch (error) {
      setError('Failed to update template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (error) {
      setError('Failed to delete template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};