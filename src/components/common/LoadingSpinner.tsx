/**
 * Reusable Loading Spinner Component
 * Provides consistent loading states across the application
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className,
  overlay = false
}) => {
  const content = (
    <div className={cn(
      "flex items-center justify-center space-x-2",
      overlay && "absolute inset-0 bg-background/80 backdrop-blur-sm z-50",
      className
    )}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return content;
  }

  return (
    <div className="py-4">
      {content}
    </div>
  );
};

export default LoadingSpinner;