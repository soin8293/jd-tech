
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RoomDetailsSectionProps {
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  bed: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const RoomDetailsSection: React.FC<RoomDetailsSectionProps> = ({
  name,
  description,
  price,
  capacity,
  size,
  bed,
  onChange,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Room Name*</Label>
          <Input 
            id="name" 
            name="name"
            value={name} 
            onChange={onChange}
            placeholder="Deluxe Room"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price per Night (USD)*</Label>
          <Input 
            id="price" 
            name="price"
            type="number"
            value={price} 
            onChange={onChange}
            placeholder="300"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          name="description"
          value={description} 
          onChange={onChange}
          placeholder="Elegant and spacious room with premium amenities..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Max Guests</Label>
          <Input 
            id="capacity" 
            name="capacity"
            type="number"
            value={capacity} 
            onChange={onChange}
            placeholder="2"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="size">Size (sq ft)</Label>
          <Input 
            id="size" 
            name="size"
            type="number"
            value={size} 
            onChange={onChange}
            placeholder="400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bed">Bed Type</Label>
          <Input 
            id="bed" 
            name="bed"
            value={bed} 
            onChange={onChange}
            placeholder="King"
          />
        </div>
      </div>
    </>
  );
};

export default RoomDetailsSection;
