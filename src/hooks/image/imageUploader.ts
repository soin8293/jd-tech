
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { validateFile } from './imageValidation';

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export const uploadImageToFirebase = (
  file: File, 
  roomId: string,
  currentUser: any,
  onProgress?: (progress: number) => void,
  onStatusUpdate?: (uploadId: string, status: UploadProgress) => void
): Promise<string> => {
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const uploadId = `${roomId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fileName = `${uploadId}_${file.name}`;
  const storageRef = ref(storage, `rooms/${roomId}/${fileName}`);

  // Initialize upload progress
  onStatusUpdate?.(uploadId, { progress: 0, status: 'uploading' });

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
        
        onStatusUpdate?.(uploadId, { progress, status: 'uploading' });
        onProgress?.(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        
        onStatusUpdate?.(uploadId, { 
          progress: 0, 
          status: 'error', 
          error: error.message 
        });

        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          onStatusUpdate?.(uploadId, { 
            progress: 100, 
            status: 'success', 
            url: downloadURL 
          });

          resolve(downloadURL);
        } catch (error: any) {
          onStatusUpdate?.(uploadId, { 
            progress: 0, 
            status: 'error', 
            error: error.message 
          });
          reject(error);
        }
      }
    );
  });
};
