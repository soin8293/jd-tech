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

  const isDevelopmentEnvironment = () => {
    const hostname = window.location.hostname;
    const devDomains = ['localhost', 'lovableproject.com', 'jd-suites-backend.web.app'];
    return devDomains.some(domain => hostname.includes(domain));
  };

  const checkAdminStatus = async (user: User) => {
    try {
      if (isDevelopmentEnvironment()) {
        console.log('Development environment detected, potentially forcing admin mode');
        setIsAdmin(true);
        return true;
      }

      const idTokenResult = await user.getIdTokenResult();
      const hasAdminClaim = !!idTokenResult.claims.admin;
      console.log('Admin status check:', { hasAdminClaim, claims: idTokenResult.claims });
      setIsAdmin(hasAdminClaim);
      return hasAdminClaim;
    } catch (error) {
      console.error("Error checking admin status:", error);
      
      if (isDevelopmentEnvironment()) {
        console.log('Fallback: Forcing admin mode due to error');
        setIsAdmin(true);
        return true;
      }
      
      setIsAdmin(false);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      if (isDevelopmentEnvironment()) {
        auth.useDeviceLanguage();
      }
      
      const result = await signInWithPopup(auth, provider);
      
      await checkAdminStatus(result.user);
      
      toast({
        title: "Success",
        description: "You have successfully signed in with Google",
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
      
      let errorMessage = "Could not sign in with Google. Please try again.";
      if ((error as any)?.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google sign-in. Please contact support.";
      } else if ((error as any)?.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed before completion.";
      }
      
      toast({
        title: "Sign-in Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

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

  const refreshUserClaims = async () => {
    if (!currentUser) return;
    
    try {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user');
      setCurrentUser(user);
      
      if (user) {
        await checkAdminStatus(user);
      } else {
        if (isDevelopmentEnvironment()) {
          console.log('Setting admin to true for no user in development');
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

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
