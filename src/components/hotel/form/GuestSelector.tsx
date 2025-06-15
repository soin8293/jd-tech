import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

interface GuestSelectorProps {
  guests: number;
  onGuestsChange: (guests: number) => void;
}

const GuestSelector: React.FC<GuestSelectorProps> = ({ guests, onGuestsChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Guests</label>
      <Select
        value={guests.toString()}
        onValueChange={(value) => onGuestsChange(parseInt(value))}
      >
        <SelectTrigger className="h-12">
          <SelectValue placeholder="Select guests">
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              {guests} Guest{guests !== 1 ? 's' : ''}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <SelectItem key={num} value={num.toString()}>
              {num} Guest{num !== 1 ? 's' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GuestSelector;