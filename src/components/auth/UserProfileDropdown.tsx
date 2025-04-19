
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShoppingBag, Mail, Settings } from "lucide-react";
import SupportModal from "../support/SupportModal";
import AdminMenu from "../admin/AdminMenu";

const UserProfileDropdown = () => {
  const { currentUser, isAdmin, logout, signInWithGoogle } = useAuth();
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {currentUser ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {currentUser.displayName || "User"}
                {isAdmin && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                    Admin
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/my-bookings" className="flex w-full cursor-pointer items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  My Bookings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSupportModalOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </DropdownMenuItem>
              
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/room-management" className="flex w-full cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Room Management
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAdminMenu(!showAdminMenu)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SupportModal
            open={supportModalOpen}
            onOpenChange={setSupportModalOpen}
          />
        </>
      ) : (
        <Button onClick={signInWithGoogle} variant="outline" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Login with Google
        </Button>
      )}
      
      {showAdminMenu && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdminMenu(false)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <AdminMenu />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
