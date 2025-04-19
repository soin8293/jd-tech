
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user has admin claim
  const checkAdminStatus = async (user: User) => {
    try {
      const idTokenResult = await user.getIdTokenResult();
      const hasAdminClaim = !!idTokenResult.claims.admin;
      setIsAdmin(hasAdminClaim);
      return hasAdminClaim;
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      return false;
    }
  };

  // Refresh user token to get latest claims
  const refreshUserClaims = async () => {
    if (!currentUser) return;
    
    try {
      // Force token refresh
      await currentUser.getIdToken(true);
      const isUserAdmin = await checkAdminStatus(currentUser);
      
      toast({
        title: "Permissions refreshed",
        description: isUserAdmin 
          ? "Admin permissions confirmed." 
          : "User permissions updated.",
      });
    } catch (error) {
      console.error("Error refreshing claims:", error);
      toast({
        title: "Failed to refresh permissions",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await checkAdminStatus(user);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check admin status after sign in
      await checkAdminStatus(result.user);
      
      toast({
        title: "Success",
        description: "You have successfully signed in with Google",
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Sign-in Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    currentUser,
    isLoading,
    isAdmin,
    signInWithGoogle,
    logout,
    refreshUserClaims
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
