import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface NavigationLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({ 
  to, 
  icon: Icon, 
  label, 
  className = "" 
}) => {
  return (
    <Link 
      to={to} 
      className={`text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 relative z-10 ${className}`}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
};

export default NavigationLink;