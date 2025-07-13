
import React from "react";
import { SimpleValidatedInput } from "@/components/forms/SimpleValidatedInput";
import { SimpleValidatedTextarea } from "@/components/forms/SimpleValidatedTextarea";
import { validationSchemas } from "@/utils/inputValidation";

interface RoomDetailsSectionProps {
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  bed: string;
  onChange: (name: string, value: string | number) => void;
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
        <SimpleValidatedInput
          label="Room Name"
          name="name"
          value={name}
          onChange={onChange}
          schema={validationSchemas.roomName}
          placeholder="Deluxe Room"
          required
        />
        
        <SimpleValidatedInput
          label="Price per Night (USD)"
          name="price"
          value={price}
          onChange={onChange}
          schema={validationSchemas.price}
          type="number"
          placeholder="300"
          required
        />
      </div>
      
      <SimpleValidatedTextarea
        label="Description"
        name="description"
        value={description}
        onChange={onChange}
        schema={validationSchemas.roomDescription}
        placeholder="Elegant and spacious room with premium amenities..."
        rows={3}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimpleValidatedInput
          label="Max Guests"
          name="capacity"
          value={capacity}
          onChange={onChange}
          schema={validationSchemas.capacity}
          type="number"
          placeholder="2"
          required
        />
        
        <SimpleValidatedInput
          label="Size (sq ft)"
          name="size"
          value={size}
          onChange={onChange}
          schema={validationSchemas.size}
          type="number"
          placeholder="400"
        />
        
        <SimpleValidatedInput
          label="Bed Type"
          name="bed"
          value={bed}
          onChange={onChange}
          schema={validationSchemas.bedType}
          placeholder="King"
          required
        />
      </div>
    </>
  );
};

export default RoomDetailsSection;
