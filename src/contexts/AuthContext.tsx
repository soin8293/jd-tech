
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { 
  GoogleAuthProvider, 
  signInWithRedirect,  // Changed from signInWithPopup
  signOut, 
  onAuthStateChanged,
  getRedirectResult,  // Added to handle redirect result
  User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { AuthContextType } from "./AuthContext.types";
import { isDevelopmentEnvironment, checkAdminStatus } from "./authHelpers";
export { useAuth } from "./useAuth";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const signInWithGoogle = async () => {
    try {
      console.log('Initiating Google sign-in from domain:', window.location.hostname);
      console.log('Firebase Auth Config:', {
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      });
      const provider = new GoogleAuthProvider();
      
      // Use signInWithRedirect instead of signInWithPopup
      await signInWithRedirect(auth, provider);
      
      // Note: The actual result handling will be done in useEffect
    } catch (error: any) {
      console.error("Google sign-in error:", {
        code: error?.code,
        message: error?.message,
        details: error
      });
      
      let errorMessage = "Could not sign in with Google. Please try again.";
      
      if (error?.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        errorMessage = `Authentication Error: This domain (${currentDomain}) is not authorized in Firebase.`;
        console.error(`Unauthorized domain error. Domain "${currentDomain}" must be added to Firebase Console.`);
        console.error(`To fix this: Go to Firebase Console > Authentication > Settings > Authorized Domains and add "${currentDomain}"`);
        
        toast({
          title: "Domain Not Authorized",
          description: errorMessage,
          variant: "destructive",
        });
        
        setTimeout(() => {
          toast({
            title: "How to Fix",
            description: "The site owner needs to add this domain to Firebase authorized domains list.",
            variant: "destructive",
          });
        }, 1000);
      } else if (error?.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled.";
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
      // Clear admin state immediately
      setIsAdmin(false);
      
      // Clear any cached data or local storage if needed
      localStorage.removeItem('adminStatus');
      sessionStorage.clear();
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Redirect to home page after logout
      if (window.location.pathname === '/room-management') {
        window.location.href = '/';
      }
      
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
      const isUserAdmin = await checkAdminStatus(currentUser, setIsAdmin);
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
    console.log('Setting up auth state and redirect result listener');
    
    // Check for redirect result when the component mounts
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect sign-in successful:', result.user.email);
          await checkAdminStatus(result.user, setIsAdmin);
          
          toast({
            title: "Success",
            description: "You have successfully signed in with Google",
          });
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        
        toast({
          title: "Sign-in Failed",
          description: "Could not complete sign-in. Please try again.",
          variant: "destructive",
        });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        // Persist user session
        localStorage.setItem('lastAuthCheck', Date.now().toString());
        await checkAdminStatus(user, setIsAdmin);
        
        // Cache admin status for faster loading
        if (isAdmin) {
          localStorage.setItem('adminStatus', 'true');
        } else {
          localStorage.removeItem('adminStatus');
        }
      } else {
        setIsAdmin(false);
        localStorage.removeItem('adminStatus');
        localStorage.removeItem('lastAuthCheck');
      }
      
      if (!authInitialized) {
        setAuthInitialized(true);
      }
      setIsLoading(false);
    });

    // Check redirect result when component mounts
    checkRedirectResult();

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    isLoading,
    isAdmin,
    authInitialized,
    signInWithGoogle,
    logout,
    refreshUserClaims
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

