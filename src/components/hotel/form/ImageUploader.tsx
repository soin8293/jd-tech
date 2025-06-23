
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileImage, Loader2, Shield } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  roomId: string;
  onImageUploaded: (imageUrl: string) => void;
  disabled?: boolean;
  maxImages?: number;
  currentImageCount?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  roomId,
  onImageUploaded,
  disabled = false,
  maxImages = 10,
  currentImageCount = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage } = useImageUpload();
  const { canUploadImages, isCheckingPermissions } = useAdminPermissions();
  const { toast } = useToast();

  const canUploadMore = currentImageCount < maxImages;
  const isDisabled = disabled || !canUploadImages || isCheckingPermissions;

  // Show permission denied message if user doesn't have upload rights
  if (!isCheckingPermissions && !canUploadImages) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You need administrator privileges to upload images.
        </AlertDescription>
      </Alert>
    );
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !canUploadMore || isDisabled) return;

    const file = files[0];
    setError('');
    setIsUploading(true);

    try {
      const imageUrl = await uploadImage(file, roomId, setUploadProgress);
      onImageUploaded(imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been successfully uploaded",
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      toast({
        title: "Upload failed",
        description: err.message || 'Failed to upload image',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled && canUploadMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!isDisabled && canUploadMore) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    if (!isDisabled && canUploadMore) {
      fileInputRef.current?.click();
    }
  };

  if (isCheckingPermissions) {
    return (
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${isDisabled || !canUploadMore ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isDisabled || !canUploadMore}
        />
        
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Uploading image...</p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% complete</p>
          </div>
        ) : (
          <div className="space-y-2">
            <FileImage className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {canUploadMore ? 'Drop images here or click to upload' : `Maximum ${maxImages} images reached`}
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP up to 5MB • Admin access required
              </p>
              {!canUploadMore && (
                <p className="text-xs text-amber-600 mt-1">
                  Remove some images to upload more
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Images: {currentImageCount}/{maxImages}</span>
        <span>Secure Firebase Storage</span>
      </div>
    </div>
  );
};

export default ImageUploader;
