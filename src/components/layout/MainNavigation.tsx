
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const MainNavigation = () => {
  const { isAdmin } = useAuth();

  return (
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
  );
};

export default MainNavigation;
