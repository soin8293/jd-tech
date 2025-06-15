
import React from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface UserAuthButtonProps {
  onClick: () => void;
}

const UserAuthButton = ({ onClick }: UserAuthButtonProps) => {
  const handleClick = () => {
    console.log("🔥 BUTTON: Login button clicked!");
    onClick();
  };

  return (
    <Button 
      onClick={handleClick} 
      variant="outline" 
      className="flex items-center gap-2 h-10 px-4"
    >
      <User className="h-4 w-4" />
      Login
    </Button>
  );
};

export default UserAuthButton;
