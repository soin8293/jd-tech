
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { uploadImageToFirebase, UploadProgress } from './imageUploader';
import { deleteImageFromFirebase } from './imageDeleter';

export const useImageUpload = () => {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const { monitorAdminAction } = useSecurityMonitoring();

  const handleStatusUpdate = useCallback((uploadId: string, status: UploadProgress) => {
    setUploads(prev => ({
      ...prev,
      [uploadId]: status
    }));
  }, []);

  const uploadImage = useCallback(async (
    file: File, 
    roomId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!currentUser || !isAdmin) {
      throw new Error('Admin access required for image uploads');
    }

    try {
      const downloadURL = await uploadImageToFirebase(
        file, 
        roomId, 
        currentUser, 
        onProgress,
        handleStatusUpdate
      );

      monitorAdminAction('IMAGE_UPLOAD_SUCCESS', 'room_image', {
        roomId,
        fileName: file.name,
        downloadURL,
        fileSize: file.size
      });

      return downloadURL;
    } catch (error: any) {
      monitorAdminAction('IMAGE_UPLOAD_FAILED', 'room_image', {
        roomId,
        fileName: file.name,
        error: error.message
      });
      throw error;
    }
  }, [currentUser, isAdmin, handleStatusUpdate, monitorAdminAction]);

  const deleteImage = useCallback(async (imageUrl: string, roomId: string): Promise<void> => {
    if (!currentUser || !isAdmin) {
      throw new Error('Admin access required for image deletion');
    }

    try {
      await deleteImageFromFirebase(imageUrl);

      monitorAdminAction('IMAGE_DELETE_SUCCESS', 'room_image', {
        roomId,
        imageUrl
      });

      toast({
        title: "Image deleted",
        description: "Image has been removed from storage",
      });

    } catch (error: any) {
      monitorAdminAction('IMAGE_DELETE_FAILED', 'room_image', {
        roomId,
        imageUrl,
        error: error.message
      });

      throw error;
    }
  }, [currentUser, isAdmin, monitorAdminAction, toast]);

  const getUploadStatus = useCallback((uploadId: string) => {
    return uploads[uploadId];
  }, [uploads]);

  const clearUploadStatus = useCallback((uploadId: string) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[uploadId];
      return newUploads;
    });
  }, []);

  return {
    uploadImage,
    deleteImage,
    getUploadStatus,
    clearUploadStatus,
    uploads
  };
};
