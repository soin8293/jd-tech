import React from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminNavigationLink: React.FC = () => {
  const { isAdmin } = useAuth();
  // Temporarily show admin for testing - remove this line when done testing
  const showAdmin = true; // isAdmin;

  if (!showAdmin) {
    return null;
  }

  return (
    <Link 
      to="/room-management"
      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 relative z-10"
      onClick={() => console.log('🔥 Admin Link clicked!')}
    >
      <Settings className="h-5 w-5" />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  );
};

export default AdminNavigationLink;