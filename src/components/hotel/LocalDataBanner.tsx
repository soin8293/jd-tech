
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const LocalDataBanner: React.FC = () => {
  return (
    <Alert 
      variant="default" 
      className="bg-amber-100 border border-amber-300 text-amber-800 mb-6"
    >
      <AlertTriangle className="h-5 w-5 mr-2" />
      <AlertTitle>Working with local data</AlertTitle>
      <AlertDescription>
        Unable to connect to the database due to permission issues. Changes will only be saved locally and won't persist after page refresh.
      </AlertDescription>
    </Alert>
  );
};

export default LocalDataBanner;
