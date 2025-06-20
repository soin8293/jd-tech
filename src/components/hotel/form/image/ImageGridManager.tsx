
import React from 'react';
import DragDropImageGrid from '../DragDropImageGrid';

interface ImageGridManagerProps {
  images: string[];
  onReorder: (reorderedImages: string[]) => void;
  onDelete: (imageUrl: string) => Promise<void>;
  deletingImages: Set<string>;
}

const ImageGridManager: React.FC<ImageGridManagerProps> = ({
  images,
  onReorder,
  onDelete,
  deletingImages
}) => {
  const handleReorderImages = (reorderedImages: string[]) => {
    onReorder(reorderedImages);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-muted-foreground">No images added yet</p>
        <p className="text-sm text-muted-foreground">Upload images above or add URLs below</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Current Images ({images.length}/10)</h4>
      <p className="text-xs text-muted-foreground">
        💡 Drag images to reorder them. The first image will be the main room photo.
      </p>
      <DragDropImageGrid
        images={images}
        onReorder={handleReorderImages}
        onDelete={onDelete}
        deletingImages={deletingImages}
      />
    </div>
  );
};

export default ImageGridManager;
