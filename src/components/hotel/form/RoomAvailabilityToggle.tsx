
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RoomAvailabilityToggleProps {
  availability: boolean;
  onToggle: (checked: boolean) => void;
}

const RoomAvailabilityToggle: React.FC<RoomAvailabilityToggleProps> = ({
  availability,
  onToggle,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>Availability</Label>
        <Switch 
          checked={availability}
          onCheckedChange={onToggle}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {availability 
          ? "This room is available for booking"
          : "This room is not available for booking"
        }
      </p>
    </div>
  );
};

export default RoomAvailabilityToggle;
