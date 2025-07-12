
import React from "react";
import { Home, Building2, Calendar } from "lucide-react";
import { NavigationLink, AdminNavigationLink } from "./navigation";

const MainNavigation = () => {
  console.log('📊 MainNavigation rendering');
  
  return (
    <nav className="flex space-x-6 flex-grow justify-center relative">
      <NavigationLink 
        to="/" 
        icon={Home} 
        label="Home" 
      />
      <NavigationLink 
        to="/hotel" 
        icon={Building2} 
        label="Rooms" 
      />
      <NavigationLink 
        to="/booking" 
        icon={Calendar} 
        label="Book Now" 
      />
      <AdminNavigationLink />
    </nav>
  );
};

export default MainNavigation;
