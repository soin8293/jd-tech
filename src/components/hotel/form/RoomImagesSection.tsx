
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { useImageUpload } from "@/hooks/useImageUpload";
import ImageUploader from "./ImageUploader";
import ImageGridManager from "./image/ImageGridManager";
import ImageUrlInput from "./image/ImageUrlInput";
import ImageSectionInfo from "./image/ImageSectionInfo";
import { useToast } from "@/hooks/use-toast";

interface RoomImagesSectionProps {
  images: string[];
  onAddImage: (imageUrl: string) => void;
  onRemoveImage: (imageUrl: string) => void;
  roomId?: string;
}

const RoomImagesSection: React.FC<RoomImagesSectionProps> = ({
  images,
  onAddImage,
  onRemoveImage,
  roomId = 'temp'
}) => {
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const { deleteImage } = useImageUpload();
  const { toast } = useToast();

  const handleDeleteImage = async (imageUrl: string) => {
    setDeletingImages(prev => new Set(prev).add(imageUrl));
    
    try {
      // If it's a Firebase Storage URL, delete from storage
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        await deleteImage(imageUrl, roomId);
      }
      
      // Remove from room images list
      onRemoveImage(imageUrl);
      
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: "Failed to delete image. You can still remove it from the list.",
        variant: "destructive",
      });
      
      // Still remove from list even if storage deletion failed
      onRemoveImage(imageUrl);
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageUrl);
        return newSet;
      });
    }
  };

  const handleReorderImages = (reorderedImages: string[]) => {
    // For now, we'll handle reordering by updating the parent state
    // This could be optimized with a more sophisticated approach
    console.log('Image reorder requested:', reorderedImages);
  };

  return (
    <div className="space-y-4">
      <Label>Room Images</Label>
      
      {/* File Upload Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Upload New Images</h4>
        <ImageUploader
          roomId={roomId}
          onImageUploaded={onAddImage}
          maxImages={10}
          currentImageCount={images.length}
        />
      </div>

      {/* Current Images Display with Drag & Drop */}
      <ImageGridManager
        images={images}
        onReorder={handleReorderImages}
        onDelete={handleDeleteImage}
        deletingImages={deletingImages}
      />

      {/* Manual URL Input Section */}
      <ImageUrlInput
        onAddImage={onAddImage}
        images={images}
        maxImages={10}
      />

      <ImageSectionInfo />
    </div>
  );
};

export default RoomImagesSection;
