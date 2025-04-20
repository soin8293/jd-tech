
import React from "react";
import { Link } from "react-router-dom";
import { User as UserType } from "firebase/auth";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShoppingBag, Mail, Settings } from "lucide-react";

interface UserProfileMenuContentProps {
  currentUser: UserType;
  isAdmin: boolean;
  onSupportClick: () => void;
  onAdminClick: () => void;
  onLogout: () => void;
}

const UserProfileMenuContent = ({
  currentUser,
  isAdmin,
  onSupportClick,
  onAdminClick,
  onLogout,
}: UserProfileMenuContentProps) => {
  return (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>
        {currentUser.displayName || "User"}
        {isAdmin && (
          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
            Admin
          </span>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/my-bookings" className="flex w-full cursor-pointer items-center">
          <ShoppingBag className="mr-2 h-4 w-4" />
          My Bookings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onSupportClick}>
        <Mail className="mr-2 h-4 w-4" />
        Contact Support
      </DropdownMenuItem>
      
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/room-management" className="flex w-full cursor-pointer items-center">
              <Settings className="mr-2 h-4 w-4" />
              Room Management
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAdminClick}>
            <Settings className="mr-2 h-4 w-4" />
            Admin Dashboard
          </DropdownMenuItem>
        </>
      )}
      
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

export default UserProfileMenuContent;

