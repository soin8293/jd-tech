import React from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminNavigationLink: React.FC = () => {
  const { isAdmin } = useAuth();
  // Temporarily show admin for testing - remove this line when done testing
  const showAdmin = true; // isAdmin;

  console.log('🔍 AdminNavigationLink render - showAdmin:', showAdmin, 'isAdmin:', isAdmin);

  if (!showAdmin) {
    console.log('❌ AdminNavigationLink not rendering - showAdmin is false');
    return null;
  }

  console.log('✅ AdminNavigationLink rendering Link component');

  return (
    <Link 
      to="/room-management"
      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 relative z-10"
      onClick={(e) => {
        console.log('🔥 Admin Link clicked!');
        console.log('Event target:', e.target);
        console.log('Event currentTarget:', e.currentTarget);
        console.log('Current URL before navigation:', window.location.href);
      }}
      onMouseEnter={() => console.log('🎯 Admin Link mouse enter')}
      onMouseLeave={() => console.log('🎯 Admin Link mouse leave')}
    >
      <Settings className="h-5 w-5" />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  );
};

export default AdminNavigationLink;