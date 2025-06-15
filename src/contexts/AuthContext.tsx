
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
import { authLogger, withAuthPerformanceMarker } from "@/utils/authLogger";
export { useAuth } from "./useAuth";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const signInWithGoogle = withAuthPerformanceMarker(async () => {
    const endTimer = authLogger.startTimer('signInWithGoogle');
    
    try {
      authLogger.info('AuthContext.signInWithGoogle', 'Initiating Google sign-in', {
        domain: window.location.hostname,
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        userAgent: navigator.userAgent,
      });

      // Assert Firebase is properly initialized
      authLogger.assert(!!auth, 'Firebase auth must be initialized');
      authLogger.assert(!!auth.app, 'Firebase app must be available');

      const provider = new GoogleAuthProvider();
      
      // Add additional scopes for better user info
      provider.addScope('email');
      provider.addScope('profile');
      
      authLogger.debug('AuthContext.signInWithGoogle', 'Starting redirect to Google OAuth');
      
      // Use signInWithRedirect instead of signInWithPopup
      await signInWithRedirect(auth, provider);
      
      authLogger.info('AuthContext.signInWithGoogle', 'Redirect initiated successfully');
      // Note: The actual result handling will be done in useEffect
    } catch (error: any) {
      endTimer();
      
      authLogger.error('AuthContext.signInWithGoogle', 'Google sign-in failed', {
        errorCode: error?.code,
        errorMessage: error?.message,
        errorStack: error?.stack,
        domain: window.location.hostname,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });
      
      let errorMessage = "Could not sign in with Google. Please try again.";
      
      if (error?.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        errorMessage = `Authentication Error: This domain (${currentDomain}) is not authorized in Firebase.`;
        
        authLogger.error('AuthContext.signInWithGoogle', 'Unauthorized domain error', {
          domain: currentDomain,
          fixInstructions: 'Add domain to Firebase Console > Authentication > Settings > Authorized Domains',
        });
        
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
        authLogger.warn('AuthContext.signInWithGoogle', 'User cancelled sign-in');
      } else if (error?.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
        authLogger.error('AuthContext.signInWithGoogle', 'Network error during sign-in');
      }
      
      toast({
        title: "Sign-in Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, 'signInWithGoogle');

  const logout = withAuthPerformanceMarker(async () => {
    const endTimer = authLogger.startTimer('logout');
    
    try {
      authLogger.info('AuthContext.logout', 'Starting logout process', {
        userId: currentUser?.uid,
        email: currentUser?.email,
        currentPath: window.location.pathname,
      });

      // Assert user exists before logout
      authLogger.assert(!!currentUser, 'User must be logged in to logout');
      
      // Clear admin state immediately
      setIsAdmin(false);
      authLogger.debug('AuthContext.logout', 'Admin state cleared');
      
      // Clear any cached data or local storage if needed
      localStorage.removeItem('adminStatus');
      sessionStorage.clear();
      authLogger.debug('AuthContext.logout', 'Local storage cleared');
      
      // Sign out from Firebase
      await signOut(auth);
      authLogger.info('AuthContext.logout', 'Firebase sign-out completed');
      
      // Redirect to home page after logout
      if (window.location.pathname === '/room-management') {
        authLogger.info('AuthContext.logout', 'Redirecting from room-management to home');
        window.location.href = '/';
      }
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      
      endTimer();
    } catch (error: any) {
      endTimer();
      
      authLogger.error('AuthContext.logout', 'Logout failed', {
        errorCode: error?.code,
        errorMessage: error?.message,
        errorStack: error?.stack,
        userId: currentUser?.uid,
      });
      
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  }, 'logout');

  const refreshUserClaims = withAuthPerformanceMarker(async () => {
    if (!currentUser) {
      authLogger.warn('AuthContext.refreshUserClaims', 'No current user to refresh claims for');
      return;
    }

    const endTimer = authLogger.startTimer('refreshUserClaims');
    
    try {
      authLogger.info('AuthContext.refreshUserClaims', 'Starting claims refresh', {
        userId: currentUser.uid,
        email: currentUser.email,
      });

      await currentUser.getIdToken(true);
      authLogger.debug('AuthContext.refreshUserClaims', 'ID token refreshed');
      
      const isUserAdmin = await checkAdminStatus(currentUser, setIsAdmin);
      authLogger.info('AuthContext.refreshUserClaims', 'Claims refreshed successfully', {
        isAdmin: isUserAdmin,
        userId: currentUser.uid,
      });
      
      toast({
        title: "Permissions refreshed",
        description: isUserAdmin 
          ? "Admin permissions confirmed." 
          : "User permissions updated.",
      });
      
      endTimer();
    } catch (error: any) {
      endTimer();
      
      authLogger.error('AuthContext.refreshUserClaims', 'Failed to refresh claims', {
        errorCode: error?.code,
        errorMessage: error?.message,
        userId: currentUser?.uid,
      });
      
      toast({
        title: "Failed to refresh permissions",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  }, 'refreshUserClaims');

  useEffect(() => {
    authLogger.info('AuthContext.useEffect', 'Setting up auth state and redirect result listener', {
      traceId: authLogger.getTraceId(),
      requestId: authLogger.getRequestId(),
    });
    
    // Check for redirect result when the component mounts
    const checkRedirectResult = withAuthPerformanceMarker(async () => {
      try {
        authLogger.debug('AuthContext.checkRedirectResult', 'Checking for redirect result');
        
        const result = await getRedirectResult(auth);
        if (result) {
          authLogger.info('AuthContext.checkRedirectResult', 'Redirect sign-in successful', {
            userId: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            providerId: result.providerId,
            operationType: result.operationType,
          });

          // Set user ID for subsequent logs
          authLogger.setUserId(result.user.uid);
          
          await checkAdminStatus(result.user, setIsAdmin);
          
          toast({
            title: "Success",
            description: "You have successfully signed in with Google",
          });
        } else {
          authLogger.debug('AuthContext.checkRedirectResult', 'No redirect result found');
        }
      } catch (error: any) {
        authLogger.error('AuthContext.checkRedirectResult', 'Error handling redirect result', {
          errorCode: error?.code,
          errorMessage: error?.message,
          errorStack: error?.stack,
        });
        
        toast({
          title: "Sign-in Failed",
          description: "Could not complete sign-in. Please try again.",
          variant: "destructive",
        });
      }
    }, 'checkRedirectResult');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const authStateTimer = authLogger.startTimer('onAuthStateChanged');
      
      authLogger.info('AuthContext.onAuthStateChanged', 'Auth state changed', {
        hasUser: !!user,
        userId: user?.uid,
        email: user?.email,
        isEmailVerified: user?.emailVerified,
        creationTime: user?.metadata?.creationTime,
        lastSignInTime: user?.metadata?.lastSignInTime,
        authInitialized,
        currentIsLoading: isLoading,
      });

      setCurrentUser(user);
      
      if (user) {
        // Set user ID for all subsequent logs
        authLogger.setUserId(user.uid);
        
        // Assert user has required properties
        authLogger.assert(!!user.uid, 'User must have UID');
        authLogger.assert(!!user.email, 'User must have email');
        
        // Persist user session
        const lastAuthCheck = Date.now().toString();
        localStorage.setItem('lastAuthCheck', lastAuthCheck);
        authLogger.debug('AuthContext.onAuthStateChanged', 'User session persisted', {
          lastAuthCheck,
        });
        
        const isUserAdmin = await checkAdminStatus(user, setIsAdmin);
        
        // Cache admin status for faster loading using the actual returned value
        if (isUserAdmin) {
          localStorage.setItem('adminStatus', 'true');
          authLogger.debug('AuthContext.onAuthStateChanged', 'Admin status cached');
        } else {
          localStorage.removeItem('adminStatus');
        }
      } else {
        authLogger.info('AuthContext.onAuthStateChanged', 'User signed out, clearing state');
        setIsAdmin(false);
        localStorage.removeItem('adminStatus');
        localStorage.removeItem('lastAuthCheck');
        authLogger.clearLogs(); // Clear logs on logout for privacy
      }
      
      if (!authInitialized) {
        setAuthInitialized(true);
        authLogger.info('AuthContext.onAuthStateChanged', 'Auth initialization completed');
      }
      setIsLoading(false);
      
      authStateTimer();
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

