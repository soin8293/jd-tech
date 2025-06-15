import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RoomTemplate, RoomCategory, CreateTemplateData, CreateCategoryData, TemplateFilters } from '@/types/template.types';
import { Room } from '@/types/hotel.types';
import { logger } from '@/utils/logger';

const TEMPLATES_COLLECTION = 'roomTemplates';
const CATEGORIES_COLLECTION = 'roomCategories';

// Template operations
export const createTemplate = async (data: CreateTemplateData, userId: string): Promise<RoomTemplate> => {
  try {
    const templateData = {
      ...data,
      version: 1,
      isActive: true,
      usageCount: 0,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), templateData);
    
    logger.info('Template created successfully', { templateId: docRef.id });
    
    return {
      id: docRef.id,
      ...templateData
    };
  } catch (error) {
    logger.error('Failed to create template', error);
    throw new Error('Failed to create room template');
  }
};

export const getTemplates = async (filters?: TemplateFilters): Promise<RoomTemplate[]> => {
  try {
    let templatesQuery = query(
      collection(db, TEMPLATES_COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    // Apply filters
    if (filters?.categoryId) {
      templatesQuery = query(templatesQuery, where('categoryId', '==', filters.categoryId));
    }

    const snapshot = await getDocs(templatesQuery);
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as RoomTemplate[];

    // Apply client-side filters for complex queries
    let filteredTemplates = templates;

    if (filters?.priceRange) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.price >= filters.priceRange!.min && 
        template.price <= filters.priceRange!.max
      );
    }

    if (filters?.capacity) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.capacity >= filters.capacity!
      );
    }

    if (filters?.amenities?.length) {
      filteredTemplates = filteredTemplates.filter(template =>
        filters.amenities!.some(amenity => template.amenities.includes(amenity))
      );
    }

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower)
      );
    }

    logger.info('Templates retrieved successfully', { count: filteredTemplates.length });
    return filteredTemplates;
  } catch (error) {
    logger.error('Failed to get templates', error);
    throw new Error('Failed to retrieve room templates');
  }
};

export const updateTemplate = async (templateId: string, updates: Partial<RoomTemplate>): Promise<void> => {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(templateRef, {
      ...updates,
      updatedAt: new Date()
    });

    logger.info('Template updated successfully', { templateId });
  } catch (error) {
    logger.error('Failed to update template', error);
    throw new Error('Failed to update room template');
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(templateRef, {
      isActive: false,
      updatedAt: new Date()
    });

    logger.info('Template deleted successfully', { templateId });
  } catch (error) {
    logger.error('Failed to delete template', error);
    throw new Error('Failed to delete room template');
  }
};

export const createRoomFromTemplate = async (templateId: string): Promise<Room> => {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }

    const template = templateDoc.data() as RoomTemplate;
    
    // Create room from template
    const roomData = {
      name: `${template.name} - ${Date.now()}`,
      description: template.description,
      price: template.price,
      capacity: template.capacity,
      size: template.size,
      bed: template.bed,
      amenities: [...template.amenities],
      images: [...template.images],
      availability: true,
      bookings: [],
      templateId: templateId,
      templateVersion: template.version
    };

    // Add to rooms collection
    const roomRef = await addDoc(collection(db, 'rooms'), roomData);

    // Update template usage count
    await updateDoc(templateRef, {
      usageCount: increment(1),
      updatedAt: new Date()
    });

    logger.info('Room created from template successfully', { 
      roomId: roomRef.id, 
      templateId 
    });

    return {
      id: roomRef.id,
      ...roomData
    };
  } catch (error) {
    logger.error('Failed to create room from template', error);
    throw new Error('Failed to create room from template');
  }
};

// Category operations
export const createCategory = async (data: CreateCategoryData): Promise<RoomCategory> => {
  try {
    const categoryData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), categoryData);
    
    logger.info('Category created successfully', { categoryId: docRef.id });
    
    return {
      id: docRef.id,
      ...categoryData
    };
  } catch (error) {
    logger.error('Failed to create category', error);
    throw new Error('Failed to create room category');
  }
};

export const getCategories = async (): Promise<RoomCategory[]> => {
  try {
    const snapshot = await getDocs(
      query(collection(db, CATEGORIES_COLLECTION), orderBy('name'))
    );
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as RoomCategory[];

    logger.info('Categories retrieved successfully', { count: categories.length });
    return categories;
  } catch (error) {
    logger.error('Failed to get categories', error);
    throw new Error('Failed to retrieve room categories');
  }
};

export const updateCategory = async (categoryId: string, updates: Partial<RoomCategory>): Promise<void> => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(categoryRef, {
      ...updates,
      updatedAt: new Date()
    });

    logger.info('Category updated successfully', { categoryId });
  } catch (error) {
    logger.error('Failed to update category', error);
    throw new Error('Failed to update room category');
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    // Check if category is in use
    const templatesQuery = query(
      collection(db, TEMPLATES_COLLECTION),
      where('categoryId', '==', categoryId),
      where('isActive', '==', true)
    );
    
    const templatesSnapshot = await getDocs(templatesQuery);
    
    if (!templatesSnapshot.empty) {
      throw new Error('Cannot delete category that is in use by templates');
    }

    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(categoryRef);

    logger.info('Category deleted successfully', { categoryId });
  } catch (error) {
    logger.error('Failed to delete category', error);
    throw error;
  }
};

// Bulk operations
export const bulkUpdateTemplates = async (
  templateIds: string[], 
  operation: 'update_price' | 'update_amenities' | 'change_category' | 'toggle_active',
  data: any
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    templateIds.forEach(templateId => {
      const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
      
      switch (operation) {
        case 'update_price':
          batch.update(templateRef, { 
            price: data.price, 
            updatedAt: new Date() 
          });
          break;
        case 'update_amenities':
          batch.update(templateRef, { 
            amenities: data.amenities, 
            updatedAt: new Date() 
          });
          break;
        case 'change_category':
          batch.update(templateRef, { 
            categoryId: data.categoryId, 
            updatedAt: new Date() 
          });
          break;
        case 'toggle_active':
          batch.update(templateRef, { 
            isActive: data.isActive, 
            updatedAt: new Date() 
          });
          break;
      }
    });

    await batch.commit();
    
    logger.info('Bulk template update completed', { 
      operation, 
      templateCount: templateIds.length 
    });
  } catch (error) {
    logger.error('Failed to perform bulk template update', error);
    throw new Error('Failed to perform bulk template update');
  }
};