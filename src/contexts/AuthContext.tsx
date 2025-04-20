
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
    // Add ALL authorized domains here to ensure consistent behavior
    const validDomains = [
      'localhost',
      'lovableproject.com',
      'jd-suites-backend.web.app',
      'jd-suites-backend.firebaseapp.com'
    ];
    
    // Log the current domain for debugging
    console.log('Current hostname:', hostname);
    const isDev = validDomains.some(domain => hostname.includes(domain));
    console.log('Environment check:', { hostname, isDev, validDomains });
    return isDev;
  };

  const checkAdminStatus = async (user: User) => {
    try {
      console.log('Checking admin status for user:', user.email);
      
      if (isDevelopmentEnvironment()) {
        console.log('Development environment detected, enabling admin mode');
        setIsAdmin(true);
        return true;
      }

      const idTokenResult = await user.getIdTokenResult();
      const hasAdminClaim = !!idTokenResult.claims.admin;
      console.log('Admin status:', { hasAdminClaim, claims: idTokenResult.claims });
      setIsAdmin(hasAdminClaim);
      return hasAdminClaim;
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Initiating Google sign-in from domain:', window.location.hostname);
      const provider = new GoogleAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      console.log('Sign-in successful:', result.user.email);
      
      await checkAdminStatus(result.user);
      
      toast({
        title: "Success",
        description: "You have successfully signed in with Google",
      });
    } catch (error: any) {
      console.error("Google sign-in error:", {
        code: error?.code,
        message: error?.message,
        details: error
      });
      
      let errorMessage = "Could not sign in with Google. Please try again.";
      
      if (error?.code === 'auth/unauthorized-domain') {
        errorMessage = `This domain (${window.location.hostname}) is not authorized for Google sign-in. Please contact support.`;
        console.error(`Unauthorized domain error. Make sure ${window.location.hostname} is added to Firebase Authentication authorized domains.`);
      } else if (error?.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed before completion.";
      } else if (error?.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
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
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
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
