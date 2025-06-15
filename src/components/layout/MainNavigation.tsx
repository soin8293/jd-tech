
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Building2 } from "lucide-react";

const MainNavigation = () => {
  const { isAdmin } = useAuth();

  return (
    <nav className="flex space-x-6 flex-grow justify-center">
      <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
        <Home className="h-5 w-5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      <Link to="/hotel" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        <span className="hidden sm:inline">Rooms</span>
      </Link>
    </nav>
  );
};

export default MainNavigation;
