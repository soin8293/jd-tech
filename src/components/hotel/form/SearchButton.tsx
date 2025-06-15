import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SearchButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const SearchButton: React.FC<SearchButtonProps> = ({ onClick, isLoading }) => {
  return (
    <div className="space-y-2 flex flex-col">
      <label className="text-sm font-medium opacity-0">Search</label>
      <Button 
        onClick={onClick} 
        className="h-12 transition-all hover:shadow-md"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          "Search Availability"
        )}
      </Button>
    </div>
  );
};

export default SearchButton;