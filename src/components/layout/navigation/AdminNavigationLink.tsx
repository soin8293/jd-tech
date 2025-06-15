import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminNavigationLink: React.FC = () => {
  const { isAdmin } = useAuth();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const showAdmin = isAdmin; // Use actual admin status - no more temporary overrides

  console.log('🔍 AdminNavigationLink render - showAdmin:', showAdmin, 'isAdmin:', isAdmin);

  useEffect(() => {
    const linkElement = linkRef.current;
    if (linkElement) {
      const handleRawClick = (e: Event) => {
        console.log('🚨 RAW DOM CLICK EVENT DETECTED!', e);
        console.log('Raw event target:', e.target);
        console.log('Raw event currentTarget:', e.currentTarget);
      };
      
      linkElement.addEventListener('click', handleRawClick);
      console.log('🔧 Raw click listener added to Admin link');
      
      return () => {
        linkElement.removeEventListener('click', handleRawClick);
        console.log('🧹 Raw click listener removed');
      };
    }
  }, []);

  if (!showAdmin) {
    console.log('❌ AdminNavigationLink not rendering - showAdmin is false');
    return null;
  }

  console.log('✅ AdminNavigationLink rendering Link component');

  return (
    <Link 
      ref={linkRef}
      to="/room-management"
      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
      onClick={(e) => {
        console.log('🔥 Admin Link clicked!');
        console.log('Event target:', e.target);
        console.log('Event currentTarget:', e.currentTarget);
        console.log('Current URL before navigation:', window.location.href);
        console.log('Link element:', e.currentTarget);
        console.log('Computed styles:', window.getComputedStyle(e.currentTarget));
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