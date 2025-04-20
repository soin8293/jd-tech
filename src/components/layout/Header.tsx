
import React from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";
import MainNavigation from "./MainNavigation";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">
        <Link to="/" className="text-xl font-bold">
          JD Suites
        </Link>
        <MainNavigation />
        <UserProfileDropdown />
      </div>
    </header>
  );
};

export default Header;
