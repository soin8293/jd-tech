
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus, Trash2, ExternalLink } from "lucide-react";
import { validationSchemas } from "@/utils/inputValidation";
import { useInputSanitization } from "@/hooks/useInputSanitization";
import { useImageUpload } from "@/hooks/useImageUpload";
import ImageUploader from "./ImageUploader";
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
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const { sanitizeString } = useInputSanitization();
  const { deleteImage } = useImageUpload();
  const { toast } = useToast();

  const handleAddUrl = () => {
    if (!newImageUrl.trim()) return;

    try {
      const sanitizedUrl = sanitizeString(newImageUrl.trim(), 'imageUrl');
      validationSchemas.imageUrl.parse(sanitizedUrl);
      
      if (images.includes(sanitizedUrl)) {
        setError('Image URL already exists');
        return;
      }

      if (images.length >= 10) {
        setError('Maximum 10 images allowed');
        return;
      }

      onAddImage(sanitizedUrl);
      setNewImageUrl('');
      setError('');
    } catch (err: any) {
      setError('Invalid image URL. Please use URLs from allowed domains (Firebase Storage, Unsplash, or CDN)');
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImageUrl(e.target.value);
    if (error) setError('');
  };

  const isFirebaseImage = (url: string) => url.includes('firebasestorage.googleapis.com');

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

      {/* Current Images Display */}
      {images.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Current Images ({images.length}/10)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group rounded-md overflow-hidden border">
                <div className="aspect-video relative">
                  <img 
                    src={image} 
                    alt={`Room preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                </div>
                
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isFirebaseImage(image) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0"
                      onClick={() => window.open(image, '_blank')}
                      title="View full size"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDeleteImage(image)}
                    disabled={deletingImages.has(image)}
                    title={isFirebaseImage(image) ? "Delete from storage" : "Remove from list"}
                  >
                    {deletingImages.has(image) ? (
                      <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {isFirebaseImage(image) ? '🔒 Secure Storage' : '🔗 External URL'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-muted-foreground">No images added yet</p>
          <p className="text-sm text-muted-foreground">Upload images above or add URLs below</p>
        </div>
      )}

      {/* Manual URL Input Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Or Add Image URL</h4>
        <div className="flex gap-2">
          <Input
            value={newImageUrl}
            onChange={handleInputChange}
            placeholder="Enter secure image URL (Firebase, Unsplash, or CDN)"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
          <Button 
            type="button" 
            onClick={handleAddUrl}
            variant="outline"
            disabled={!newImageUrl.trim() || images.length >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Upload directly to secure Firebase Storage or add external URLs</p>
        <p>• Maximum 10 images allowed from trusted domains</p>
        <p>• Uploaded images are automatically optimized and secured</p>
      </div>
    </div>
  );
};

export default RoomImagesSection;
