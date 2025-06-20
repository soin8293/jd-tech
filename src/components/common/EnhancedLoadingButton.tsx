
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedLoadingButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  success?: boolean;
  error?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const EnhancedLoadingButton: React.FC<EnhancedLoadingButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  success = false,
  error = false,
  onClick,
  className,
  variant = "default",
  size = "default",
  disabled = false,
  type = "button"
}) => {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingText || "Processing..."}
        </>
      );
    }
    
    if (success) {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          Success
        </>
      );
    }
    
    if (error) {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2" />
          Error
        </>
      );
    }
    
    return children;
  };

  const getVariant = () => {
    if (success) return "default";
    if (error) return "destructive";
    return variant;
  };

  return (
    <Button
      type={type}
      variant={getVariant()}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "transition-all duration-200",
        success && "bg-green-600 hover:bg-green-700",
        error && "bg-red-600 hover:bg-red-700",
        className
      )}
    >
      {getButtonContent()}
    </Button>
  );
};

export default EnhancedLoadingButton;
