
import React from "react";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";

interface FloatingBookButtonProps {
  onBookNow: () => void;
  disabled: boolean;
}

const FloatingBookButton = ({ onBookNow, disabled }: FloatingBookButtonProps) => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        onClick={onBookNow}
        disabled={disabled}
        size="lg"
        className="shadow-lg"
      >
        <Book className="mr-2 h-4 w-4" />
        Book Now
      </Button>
    </div>
  );
};

export default FloatingBookButton;
