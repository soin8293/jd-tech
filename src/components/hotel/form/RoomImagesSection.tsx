
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

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
  const [newImageUrl, setNewImageUrl] = React.useState('');

  const handleAdd = () => {
    if (!newImageUrl.trim()) return;
    onAddImage(newImageUrl.trim());
    setNewImageUrl('');
  };

  return (
    <div className="space-y-3">
      <Label>Images</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((image, index) => (
          <div key={index} className="relative group rounded-md overflow-hidden h-24">
            <img 
              src={image} 
              alt={`Room preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemoveImage(image)}
              className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          placeholder="Enter image URL (optional)"
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
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Add optional images for your room. You can leave this section empty.
      </p>
    </div>
  );
};

export default RoomImagesSection;
