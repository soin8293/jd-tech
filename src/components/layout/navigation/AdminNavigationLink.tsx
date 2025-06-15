import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminNavigationLink: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  // Temporarily show admin for testing - remove this line when done testing
  const showAdmin = true; // isAdmin;

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔥 Admin navigation clicked!');
    console.log('Current location:', window.location.href);
    navigate('/room-management');
    console.log('Navigate called');
  };

  if (!showAdmin) {
    return null;
  }

  return (
    <button 
      onClick={handleAdminClick}
      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 relative z-10 bg-transparent border-none cursor-pointer p-0"
    >
      <Settings className="h-5 w-5" />
      <span className="hidden sm:inline">Admin</span>
    </button>
  );
};

export default AdminNavigationLink;