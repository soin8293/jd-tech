
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Building2 } from "lucide-react";

const MainNavigation = () => {
  const { isAdmin } = useAuth();

  return (
    <nav className="hidden md:flex space-x-6 flex-grow justify-center">
      <Link to="/" className="text-sm font-medium hover:text-primary transition-colors" aria-label="Home">
        <Home className="h-5 w-5" />
      </Link>
      <Link to="/hotel" className="text-sm font-medium hover:text-primary transition-colors" aria-label="Rooms">
        <Building2 className="h-5 w-5" />
      </Link>
    </nav>
  );
};

export default MainNavigation;
