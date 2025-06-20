
import React from 'react';

const ImageSectionInfo: React.FC = () => {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p>• Upload directly to secure Firebase Storage or add external URLs</p>
      <p>• Maximum 10 images allowed from trusted domains</p>
      <p>• Uploaded images are automatically optimized and secured</p>
      <p>• Drag and drop to reorder - first image becomes the main photo</p>
    </div>
  );
};

export default ImageSectionInfo;
