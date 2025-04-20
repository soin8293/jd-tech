
import React from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { isAdmin } = useAuth();
  
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">
        <Link to="/" className="text-xl font-bold">
          JD Suites
        </Link>
        
        <nav className="hidden md:flex space-x-6 flex-grow justify-center">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/hotel" className="text-sm font-medium hover:text-primary transition-colors">
            Rooms
          </Link>
          {isAdmin && (
            <Link to="/room-management" className="text-sm font-medium hover:text-primary transition-colors">
              Room Management
            </Link>
          )}
        </nav>
        
        <UserProfileDropdown />
      </div>
    </header>
  );
};

export default Header;
