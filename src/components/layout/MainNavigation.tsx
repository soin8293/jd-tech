
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Building2, Settings } from "lucide-react";

const MainNavigation = () => {
  const { currentUser } = useAuth();
  // Temporarily show admin for testing - remove this line when done testing
  const isAdmin = true; // currentUser?.email === "amirahcolorado@gmail.com";

  return (
    <nav className="flex space-x-6 flex-grow justify-center relative">
      <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 relative z-10">
        <Home className="h-5 w-5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      <Link to="/hotel" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 relative z-10">
        <Building2 className="h-5 w-5" />
        <span className="hidden sm:inline">Rooms</span>
      </Link>
      {isAdmin && (
        <button 
          onClick={() => {
            console.log('Admin button clicked, navigating to /room-management');
            window.location.href = '/room-management';
          }}
          className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 relative z-10 bg-transparent border-none cursor-pointer"
        >
          <Settings className="h-5 w-5" />
          <span className="hidden sm:inline">Admin</span>
        </button>
      )}
    </nav>
  );
};

export default MainNavigation;
