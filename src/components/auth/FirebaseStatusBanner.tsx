import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface FirebaseStatusBannerProps {
  show: boolean;
}

const FirebaseStatusBanner = ({ show }: FirebaseStatusBannerProps) => {
  if (!show) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        Firebase is not configured. Login functionality is disabled and using fallback room data.
        Please configure Firebase environment variables to enable full functionality.
      </AlertDescription>
    </Alert>
  );
};

export default FirebaseStatusBanner;