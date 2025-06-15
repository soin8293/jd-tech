
import React from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";
import MainNavigation from "./MainNavigation";

const Header = () => {
  console.log("🔥 HEADER: Header component rendering at:", new Date().toISOString());
  
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          JD Suites
        </Link>
        <MainNavigation />
        <UserProfileDropdown />
      </div>
    </header>
  );
};

export default Header;
