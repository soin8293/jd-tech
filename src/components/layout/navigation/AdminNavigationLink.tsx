import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminNavigationLink: React.FC = () => {
  const { isAdmin, authInitialized, isLoading } = useAuth();
  const navigate = useNavigate();

  // Don't show link until auth is initialized and we know admin status
  if (!authInitialized || isLoading || !isAdmin) {
    return null;
  }

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use React Router navigation instead of browser navigation
    navigate('/room-management');
  };

  return (
    <Link 
      to="/room-management"
      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
      onClick={handleAdminClick}
    >
      <Settings className="h-5 w-5" />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  );
};

export default AdminNavigationLink;