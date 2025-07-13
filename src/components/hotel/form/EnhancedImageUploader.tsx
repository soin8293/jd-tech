import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileImage, 
  Plus,
  Eye,
  Download
} from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EnhancedImageUploaderProps {
  roomId: string;
  onImageUploaded: (imageUrl: string) => void;
  maxImages?: number;
  currentImageCount?: number;
  accept?: string;
  maxFileSize?: number; // in MB
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

const EnhancedImageUploader: React.FC<EnhancedImageUploaderProps> = ({
  roomId,
  onImageUploaded,
  maxImages = 10,
  currentImageCount = 0,
  accept = "image/*",
  maxFileSize = 5,
  className
}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { uploadImage } = useImageUpload();
  const { toast } = useToast();

  const remainingSlots = Math.max(0, maxImages - currentImageCount);

  const processFiles = useCallback(async (files: File[]) => {
    // Validate file count
    if (files.length > remainingSlots) {
      toast({
        title: "Too many files",
        description: `You can only upload ${remainingSlots} more image(s).`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxFileSize}MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Initialize upload progress tracking
    const initialProgress = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadQueue(prev => [...prev, ...initialProgress]);

    // Upload files
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        // Simulate progress updates (real implementation would have actual progress)
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(item => 
            item.file === file && item.progress < 90
              ? { ...item, progress: item.progress + 10 }
              : item
          ));
        }, 200);

        const imageUrl = await uploadImage(file, roomId);
        
        clearInterval(progressInterval);
        
        setUploadQueue(prev => prev.map(item => 
          item.file === file 
            ? { ...item, progress: 100, status: 'success', url: imageUrl }
            : item
        ));

        onImageUploaded(imageUrl);

        toast({
          title: "Image uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });

      } catch (error) {
        setUploadQueue(prev => prev.map(item => 
          item.file === file 
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : item
        ));

        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}.`,
          variant: "destructive",
        });
      }
    }

    // Clear completed uploads after delay
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status === 'uploading'));
    }, 3000);
  }, [roomId, onImageUploaded, uploadImage, toast, remainingSlots, maxFileSize]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  }, [processFiles]);

  const removeFromQueue = useCallback((file: File) => {
    setUploadQueue(prev => prev.filter(item => item.file !== file));
  }, []);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Images
        </CardTitle>
        <CardDescription>
          Upload up to {maxImages} images. Maximum file size: {maxFileSize}MB each.
          {remainingSlots > 0 ? ` You can upload ${remainingSlots} more image(s).` : ' Upload limit reached.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            remainingSlots === 0 ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-primary/5",
            "group cursor-pointer"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            disabled={remainingSlots === 0}
          />
          
          <div className="space-y-4">
            <div className={cn(
              "mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              dragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            )}>
              {dragActive ? <CheckCircle className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </div>
            
            <div>
              <p className="text-lg font-medium">
                {dragActive ? "Drop your images here" : "Drag & drop images or click to browse"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports JPG, PNG, WebP formats
              </p>
            </div>
            
            {remainingSlots > 0 && (
              <Badge variant="outline" className="mt-2">
                {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
              </Badge>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Upload Progress
            </h4>
            
            <div className="space-y-2">
              {uploadQueue.map((upload, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {upload.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {upload.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {upload.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{upload.file.name}</p>
                      <div className="flex items-center gap-2">
                        {upload.status === 'success' && upload.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(upload.url, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromQueue(upload.file)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="h-2" />
                    )}
                    
                    {upload.status === 'error' && (
                      <p className="text-xs text-red-500">{upload.error}</p>
                    )}
                    
                    {upload.status === 'success' && (
                      <p className="text-xs text-green-600">Upload completed successfully</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Upload Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use high-quality images for best results</li>
            <li>Recommended resolution: 1920x1080 or higher</li>
            <li>First image will be used as the primary room image</li>
            <li>You can reorder images after uploading</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedImageUploader;