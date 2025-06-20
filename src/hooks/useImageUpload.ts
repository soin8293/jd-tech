
import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export const useImageUpload = () => {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const { monitorAdminAction } = useSecurityMonitoring();

  const validateFile = useCallback((file: File): string | null => {
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload only JPEG, PNG, or WebP images';
    }

    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    // File name validation
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      return 'File name contains invalid characters';
    }

    return null;
  }, []);

  const uploadImage = useCallback(async (
    file: File, 
    roomId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!currentUser || !isAdmin) {
      throw new Error('Admin access required for image uploads');
    }

    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const uploadId = `${roomId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${uploadId}_${file.name}`;
    const storageRef = ref(storage, `rooms/${roomId}/${fileName}`);

    // Initialize upload progress
    setUploads(prev => ({
      ...prev,
      [uploadId]: { progress: 0, status: 'uploading' }
    }));

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          uploadedBy: currentUser.uid,
          uploadedByEmail: currentUser.email || '',
          roomId,
          timestamp: new Date().toISOString()
        }
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          setUploads(prev => ({
            ...prev,
            [uploadId]: { ...prev[uploadId], progress, status: 'uploading' }
          }));
          
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          
          setUploads(prev => ({
            ...prev,
            [uploadId]: { 
              ...prev[uploadId], 
              status: 'error', 
              error: error.message 
            }
          }));

          monitorAdminAction('IMAGE_UPLOAD_FAILED', 'room_image', {
            roomId,
            fileName: file.name,
            error: error.message
          });

          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setUploads(prev => ({
              ...prev,
              [uploadId]: { 
                progress: 100, 
                status: 'success', 
                url: downloadURL 
              }
            }));

            monitorAdminAction('IMAGE_UPLOAD_SUCCESS', 'room_image', {
              roomId,
              fileName: file.name,
              downloadURL,
              fileSize: file.size
            });

            resolve(downloadURL);
          } catch (error: any) {
            setUploads(prev => ({
              ...prev,
              [uploadId]: { 
                ...prev[uploadId], 
                status: 'error', 
                error: error.message 
              }
            }));
            reject(error);
          }
        }
      );
    });
  }, [currentUser, isAdmin, validateFile, monitorAdminAction]);

  const deleteImage = useCallback(async (imageUrl: string, roomId: string): Promise<void> => {
    if (!currentUser || !isAdmin) {
      throw new Error('Admin access required for image deletion');
    }

    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      if (!pathMatch) {
        throw new Error('Invalid image URL format');
      }

      const filePath = decodeURIComponent(pathMatch[1]);
      const fileRef = ref(storage, filePath);
      
      await deleteObject(fileRef);

      monitorAdminAction('IMAGE_DELETE_SUCCESS', 'room_image', {
        roomId,
        imageUrl,
        filePath
      });

      toast({
        title: "Image deleted",
        description: "Image has been removed from storage",
      });

    } catch (error: any) {
      console.error('Delete error:', error);
      
      monitorAdminAction('IMAGE_DELETE_FAILED', 'room_image', {
        roomId,
        imageUrl,
        error: error.message
      });

      throw new Error(`Failed to delete image: ${error.message}`);
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
