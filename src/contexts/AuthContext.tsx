import React, { createContext, useState, useEffect, ReactNode, useRef } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { AuthContextType } from "./AuthContext.types";
import { isDevelopmentEnvironment, checkAdminStatus } from "./authHelpers";
import { authLogger, withAuthPerformanceMarker } from "@/utils/authLogger";
export { useAuth } from "./useAuth";

console.log("🔥 AUTH CONTEXT: File loaded at:", new Date().toISOString());

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("🔥 AUTH PROVIDER: AuthProvider function called at:", new Date().toISOString());
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  console.log("🔥 AUTH PROVIDER: State initialized");
  
  // Add state tracking for debugging
  const authStateListenerSetup = useRef(false);
  const componentMountTime = useRef(Date.now());

  console.log("🔥 AUTH PROVIDER: About to define signInWithGoogle function");

  const signInWithGoogle = withAuthPerformanceMarker(async () => {
    console.log("🔥 SIGN IN: signInWithGoogle function called at:", new Date().toISOString());
    
    const endTimer = authLogger.startTimer('signInWithGoogle');
    
    try {
      console.log("🔥 SIGN IN ATTEMPT: Starting Google sign-in process with popup");
      console.log("🔥 SIGN IN: Current URL:", window.location.href);
      console.log("🔥 SIGN IN: Current user before sign-in:", currentUser);
      
      authLogger.info('AuthContext.signInWithGoogle', 'Initiating Google sign-in with popup', {
        domain: window.location.hostname,
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        hasExistingUser: !!currentUser,
      });

      // Assert Firebase is properly initialized
      authLogger.assert(!!auth, 'Firebase auth must be initialized');
      authLogger.assert(!!auth.app, 'Firebase app must be available');

      const provider = new GoogleAuthProvider();
      
      // Add additional scopes for better user info
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log("🔥 SIGN IN: Provider configured, calling signInWithPopup...");
      authLogger.debug('AuthContext.signInWithGoogle', 'Starting popup sign-in');
      
      // Use signInWithPopup - this eliminates the race condition
      const result = await signInWithPopup(auth, provider);
      
      console.log("🔥 SIGN IN: ✅ SUCCESS! Popup sign-in completed");
      console.log("🔥 SIGN IN: User:", result.user);
      console.log("🔥 SIGN IN: User UID:", result.user.uid);
      console.log("🔥 SIGN IN: User email:", result.user.email);
      
      authLogger.info('AuthContext.signInWithGoogle', 'Popup sign-in successful', {
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
      
      endTimer();
    } catch (error: any) {
      endTimer();
      
      console.error("🔥 SIGN IN ERROR:", error);
      console.error("🔥 SIGN IN ERROR code:", error?.code);
      console.error("🔥 SIGN IN ERROR message:", error?.message);
      
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
      } else if (error?.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
        authLogger.error('AuthContext.signInWithGoogle', 'Popup blocked by browser');
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
      console.log("🔥 LOGOUT: Starting logout process");
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
      
      // Clear any cached data or local storage
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
    console.log("🔥 USE EFFECT: AuthContext useEffect triggered at:", new Date().toISOString());
    console.log("🔥 USE EFFECT: URL at mount:", window.location.href);
    
    authLogger.info('AuthContext.useEffect', 'Setting up auth state listener', {
      traceId: authLogger.getTraceId(),
      requestId: authLogger.getRequestId(),
      componentMountTime: componentMountTime.current,
      currentUrl: window.location.href,
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔥 AUTH STATE: onAuthStateChanged fired at:", new Date().toISOString());
      console.log("🔥 AUTH STATE: User object:", user);
      console.log("🔥 AUTH STATE: User UID:", user?.uid);
      console.log("🔥 AUTH STATE: User email:", user?.email);
      console.log("🔥 AUTH STATE: Auth initialized:", authInitialized);
      console.log("🔥 AUTH STATE: Is loading:", isLoading);
      
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
        timeSinceMount: Date.now() - componentMountTime.current,
      });

      setCurrentUser(user);
      console.log("🔥 AUTH STATE: Updated currentUser state");
      
      if (user) {
        console.log("🔥 AUTH STATE: User is signed in, processing...");
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
        console.log("🔥 AUTH STATE: Admin status checked:", isUserAdmin);
        
        // Cache admin status for faster loading using the actual returned value
        if (isUserAdmin) {
          localStorage.setItem('adminStatus', 'true');
          authLogger.debug('AuthContext.onAuthStateChanged', 'Admin status cached');
        } else {
          localStorage.removeItem('adminStatus');
        }
      } else {
        console.log("🔥 AUTH STATE: User is signed out, clearing state");
        authLogger.info('AuthContext.onAuthStateChanged', 'User signed out, clearing state');
        setIsAdmin(false);
        localStorage.removeItem('adminStatus');
        localStorage.removeItem('lastAuthCheck');
        authLogger.clearLogs();
      }
      
      if (!authInitialized) {
        console.log("🔥 AUTH STATE: Setting auth as initialized");
        setAuthInitialized(true);
        authLogger.info('AuthContext.onAuthStateChanged', 'Auth initialization completed');
      }
      
      console.log("🔥 AUTH STATE: Setting loading to false");
      setIsLoading(false);
      
      authStateTimer();
    });

    // Mark auth state listener as setup
    authStateListenerSetup.current = true;
    console.log("🔥 SETUP: Auth state listener setup completed");

    return () => {
      console.log("🔥 CLEANUP: Cleaning up auth context");
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this only runs once

  console.log("🔥 AUTH PROVIDER: About to create context value");
  
  const value = {
    currentUser,
    isLoading,
    isAdmin,
    authInitialized,
    signInWithGoogle,
    logout,
    refreshUserClaims
  };
  
  console.log("🔥 AUTH PROVIDER: Rendering AuthProvider with values:", {
    hasCurrentUser: !!currentUser,
    currentUserEmail: currentUser?.email,
    isLoading,
    isAdmin,
    authInitialized,
  });
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
