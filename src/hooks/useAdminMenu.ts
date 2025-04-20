
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminMenu = () => {
  const { isAdmin } = useAuth();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const toggleAdminMenu = () => setShowAdminMenu(!showAdminMenu);
  const closeAdminMenu = () => setShowAdminMenu(false);

  return {
    isAdmin,
    showAdminMenu,
    toggleAdminMenu,
    closeAdminMenu,
  };
};
