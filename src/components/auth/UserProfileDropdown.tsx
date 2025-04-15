
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShoppingBag, Mail } from "lucide-react";

const UserProfileDropdown = () => {
  const { currentUser, logout, signInWithGoogle } = useAuth();

  const handleContactSupport = () => {
    window.location.href = "mailto:support@jdsuites.com?subject=Support%20Request";
  };

  return (
    <div className="flex items-center gap-2">
      {currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "User"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {currentUser.displayName || "User"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/my-bookings" className="flex w-full cursor-pointer items-center">
                <ShoppingBag className="mr-2 h-4 w-4" />
                My Bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleContactSupport}>
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={signInWithGoogle} variant="outline" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Login with Google
        </Button>
      )}
    </div>
  );
};

export default UserProfileDropdown;
