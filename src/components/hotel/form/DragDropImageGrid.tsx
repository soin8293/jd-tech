
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, GripVertical } from 'lucide-react';

interface DragDropImageGridProps {
  images: string[];
  onReorder: (images: string[]) => void;
  onDelete: (imageUrl: string) => void;
  deletingImages: Set<string>;
}

const DragDropImageGrid: React.FC<DragDropImageGridProps> = ({
  images,
  onReorder,
  onDelete,
  deletingImages
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const reorderedImages = [...images];
    const draggedImage = reorderedImages[draggedIndex];
    
    // Remove dragged item
    reorderedImages.splice(draggedIndex, 1);
    // Insert at new position
    reorderedImages.splice(dropIndex, 0, draggedImage);
    
    onReorder(reorderedImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const isFirebaseImage = (url: string) => url.includes('firebasestorage.googleapis.com');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          className={`
            relative group rounded-md overflow-hidden border cursor-move
            transition-all duration-200 hover:shadow-lg
            ${dragOverIndex === index ? 'border-primary border-2 scale-105' : ''}
            ${draggedIndex === index ? 'opacity-50' : ''}
          `}
        >
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
          
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 rounded p-1">
              <GripVertical className="h-4 w-4 text-white cursor-move" />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isFirebaseImage(image) && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 border-0"
                onClick={() => window.open(image, '_blank')}
                title="View full size"
              >
                <ExternalLink className="h-3 w-3 text-white" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="destructive"
              className="h-7 w-7 p-0 bg-red-600/80 hover:bg-red-600"
              onClick={() => onDelete(image)}
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
          
          {/* Image Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-white text-xs truncate">
              #{index + 1} • {isFirebaseImage(image) ? '🔒 Secure Storage' : '🔗 External URL'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DragDropImageGrid;
