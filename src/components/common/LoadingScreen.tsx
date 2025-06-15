import React from "react";
import { RefreshCw } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  fullScreen = false
}) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;