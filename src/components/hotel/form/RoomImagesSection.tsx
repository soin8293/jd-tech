
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus } from "lucide-react";
import { validationSchemas } from "@/utils/inputValidation";
import { useInputSanitization } from "@/hooks/useInputSanitization";

interface RoomImagesSectionProps {
  images: string[];
  onAddImage: (imageUrl: string) => void;
  onRemoveImage: (imageUrl: string) => void;
}

const RoomImagesSection: React.FC<RoomImagesSectionProps> = ({
  images,
  onAddImage,
  onRemoveImage,
}) => {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');
  const { sanitizeString } = useInputSanitization();

  const handleAdd = () => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImageUrl(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="space-y-3">
      <Label>Images (Optional)</Label>
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group rounded-md overflow-hidden h-24">
              <img 
                src={image} 
                alt={`Room preview ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              <button
                onClick={() => onRemoveImage(image)}
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No images added yet</p>
      )}
      <div className="flex gap-2">
        <Input
          value={newImageUrl}
          onChange={handleInputChange}
          placeholder="Enter secure image URL (Firebase, Unsplash, or CDN)"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          variant="outline"
          disabled={!newImageUrl.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-muted-foreground">
        Add secure image URLs. Maximum 10 images allowed from trusted domains.
      </p>
    </div>
  );
};

export default RoomImagesSection;
