
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportModal from "../support/SupportModal";
import AdminMenu from "../admin/AdminMenu";
import UserAuthButton from "./UserAuthButton";
import { useAdminMenu } from "@/hooks/useAdminMenu";
import UserProfileMenuContent from "./UserProfileMenuContent";

const UserProfileDropdown = () => {
  const { currentUser, logout, signInWithGoogle } = useAuth();
  const { isAdmin, showAdminMenu, toggleAdminMenu, closeAdminMenu } = useAdminMenu();
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-end w-auto min-w-[120px]">
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
            <UserProfileMenuContent
              currentUser={currentUser}
              isAdmin={isAdmin}
              onSupportClick={() => setSupportModalOpen(true)}
              onAdminClick={toggleAdminMenu}
              onLogout={logout}
            />
          </DropdownMenu>
          <SupportModal
            open={supportModalOpen}
            onOpenChange={setSupportModalOpen}
          />
        </>
      ) : (
        <UserAuthButton onClick={signInWithGoogle} />
      )}
      
      {showAdminMenu && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeAdminMenu}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <AdminMenu />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;

