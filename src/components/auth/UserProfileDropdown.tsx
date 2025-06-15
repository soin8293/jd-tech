
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
import { Dialog, DialogContent } from "@/components/ui/dialog";

const UserProfileDropdown = () => {
  const { currentUser, logout, signInWithGoogle, isLoading, authInitialized } = useAuth();
  
  // Explicit UI debugging
  console.log("🔥 UI: UserProfileDropdown rendering with user:", currentUser);
  console.log("🔥 UI: Component render state:", {
    hasCurrentUser: !!currentUser,
    currentUserUid: currentUser?.uid,
    currentUserEmail: currentUser?.email,
    isLoading,
    authInitialized,
    timestamp: new Date().toISOString(),
  });
  
  const { isAdmin, showAdminMenu, toggleAdminMenu, closeAdminMenu } = useAdminMenu();
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);

  console.log("🔥 UI: Admin state:", { isAdmin, showAdminMenu });

  // Handle sign-in with comprehensive debugging
  const handleSignIn = async () => {
    console.log("🔥 UI: Sign-in button clicked");
    console.log("🔥 UI: Pre-sign-in state:", {
      currentUser,
      isLoading,
      authInitialized,
      url: window.location.href,
    });
    
    try {
      await signInWithGoogle();
      console.log("🔥 UI: Sign-in function completed");
    } catch (error) {
      console.error("🔥 UI: Sign-in error:", error);
    }
  };

  // Show loading state if auth is still initializing
  if (!authInitialized || isLoading) {
    console.log("🔥 UI: Showing loading state");
    return (
      <div className="flex items-center justify-end w-auto min-w-[120px]">
        <div className="h-10 w-10 animate-pulse bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end w-auto min-w-[120px]">
      {currentUser ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full overflow-hidden">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-full h-full block rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 mx-auto" />
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
        <UserAuthButton onClick={handleSignIn} />
      )}
      
      {showAdminMenu && isAdmin && (
        <Dialog open={showAdminMenu} onOpenChange={closeAdminMenu}>
          <DialogContent className="sm:max-w-md">
            <AdminMenu />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserProfileDropdown;
