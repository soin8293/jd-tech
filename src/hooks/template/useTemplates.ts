import { useState, useCallback, useEffect } from 'react';
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  createRoomFromTemplate,
  bulkUpdateTemplates
} from '@/services/template/templateService';
import { RoomTemplate, CreateTemplateData, TemplateFilters } from '@/types/template.types';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface TemplateState {
  templates: RoomTemplate[];
  isLoading: boolean;
  error: string | null;
  filters: TemplateFilters;
}

export const useTemplates = () => {
  const [state, setState] = useState<TemplateState>({
    templates: [],
    isLoading: false,
    error: null,
    filters: {}
  });

  // Fetch templates
  const fetchTemplates = useCallback(async (filters?: TemplateFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const templates = await getTemplates(filters);
      setState(prev => ({ 
        ...prev, 
        templates, 
        isLoading: false,
        filters: filters || {}
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch templates';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      toast({
        title: "Error Loading Templates",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  // Create new template
  const createNewTemplate = useCallback(async (
    data: CreateTemplateData, 
    userId: string
  ): Promise<RoomTemplate | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const newTemplate = await createTemplate(data, userId);
      
      setState(prev => ({ 
        ...prev, 
        templates: [newTemplate, ...prev.templates],
        isLoading: false 
      }));

      toast({
        title: "Template Created",
        description: `Template "${newTemplate.name}" has been created successfully.`,
      });

      return newTemplate;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create template';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, []);

  // Update template
  const updateExistingTemplate = useCallback(async (
    templateId: string, 
    updates: Partial<RoomTemplate>
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await updateTemplate(templateId, updates);
      
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.map(template =>
          template.id === templateId 
            ? { ...template, ...updates, updatedAt: new Date() }
            : template
        ),
        isLoading: false 
      }));

      toast({
        title: "Template Updated",
        description: "Template has been updated successfully.",
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update template';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, []);

  // Delete template
  const deleteExistingTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await deleteTemplate(templateId);
      
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.filter(template => template.id !== templateId),
        isLoading: false 
      }));

      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully.",
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete template';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, []);

  // Create room from template
  const createRoomFromExistingTemplate = useCallback(async (templateId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const room = await createRoomFromTemplate(templateId);
      
      // Update template usage count in local state
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.map(template =>
          template.id === templateId 
            ? { ...template, usageCount: template.usageCount + 1 }
            : template
        ),
        isLoading: false 
      }));

      toast({
        title: "Room Created",
        description: `New room "${room.name}" has been created from template.`,
      });

      return room;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create room from template';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Room Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, []);

  // Bulk operations
  const performBulkOperation = useCallback(async (
    templateIds: string[],
    operation: 'update_price' | 'update_amenities' | 'change_category' | 'toggle_active',
    data: any
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await bulkUpdateTemplates(templateIds, operation, data);
      
      // Refresh templates after bulk operation
      await fetchTemplates(state.filters);

      toast({
        title: "Bulk Operation Completed",
        description: `${templateIds.length} templates updated successfully.`,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to perform bulk operation';
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Bulk Operation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [state.filters, fetchTemplates]);

  // Apply filters
  const applyFilters = useCallback((filters: TemplateFilters) => {
    fetchTemplates(filters);
  }, [fetchTemplates]);

  // Clear filters
  const clearFilters = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    // State
    templates: state.templates,
    isLoading: state.isLoading,
    error: state.error,
    activeFilters: state.filters,
    
    // Actions
    fetchTemplates,
    createTemplate: createNewTemplate,
    updateTemplate: updateExistingTemplate,
    deleteTemplate: deleteExistingTemplate,
    createRoomFromTemplate: createRoomFromExistingTemplate,
    performBulkOperation,
    applyFilters,
    clearFilters
  };
};