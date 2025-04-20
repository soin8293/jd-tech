
import React from "react";
import { AlertTriangle } from "lucide-react";

const LocalDataBanner: React.FC = () => {
  return (
    <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-md mb-6 flex items-start">
      <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium">Working with local data</p>
        <p className="text-sm mt-1">
          Unable to connect to the database due to permission issues. Changes will only be saved locally and won't persist after page refresh.
        </p>
      </div>
    </div>
  );
};

export default LocalDataBanner;
