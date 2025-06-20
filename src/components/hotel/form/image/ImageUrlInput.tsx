
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus } from 'lucide-react';
import { validationSchemas } from '@/utils/inputValidation';
import { useInputSanitization } from '@/hooks/useInputSanitization';

interface ImageUrlInputProps {
  onAddImage: (imageUrl: string) => void;
  images: string[];
  maxImages: number;
}

const ImageUrlInput: React.FC<ImageUrlInputProps> = ({
  onAddImage,
  images,
  maxImages
}) => {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');
  const { sanitizeString } = useInputSanitization();

  const handleAddUrl = () => {
    if (!newImageUrl.trim()) return;

    try {
      const sanitizedUrl = sanitizeString(newImageUrl.trim(), 'imageUrl');
      validationSchemas.imageUrl.parse(sanitizedUrl);
      
      if (images.includes(sanitizedUrl)) {
        setError('Image URL already exists');
        return;
      }

      if (images.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
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
          disabled={!newImageUrl.trim() || images.length >= maxImages}
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
  );
};

export default ImageUrlInput;
