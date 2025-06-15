
import React, { createContext, useState, useEffect, ReactNode, useRef } from "react";
import { 
  GoogleAuthProvider, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  getRedirectResult,
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
  
  // Add state tracking for debugging
  const redirectCheckCompleted = useRef(false);
  const authStateListenerSetup = useRef(false);
  const componentMountTime = useRef(Date.now());

  const signInWithGoogle = withAuthPerformanceMarker(async () => {
    const endTimer = authLogger.startTimer('signInWithGoogle');
    
    try {
      console.log("🔐 REDIRECT DEBUG: Starting Google sign-in process");
      console.log("🔐 REDIRECT DEBUG: Current URL:", window.location.href);
      console.log("🔐 REDIRECT DEBUG: Current user before sign-in:", currentUser);
      
      authLogger.info('AuthContext.signInWithGoogle', 'Initiating Google sign-in', {
        domain: window.location.hostname,
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        hasExistingUser: !!currentUser,
        redirectCheckCompleted: redirectCheckCompleted.current,
      });

      // Assert Firebase is properly initialized
      authLogger.assert(!!auth, 'Firebase auth must be initialized');
      authLogger.assert(!!auth.app, 'Firebase app must be available');

      const provider = new GoogleAuthProvider();
      
      // Add additional scopes for better user info
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log("🔐 REDIRECT DEBUG: Provider configured, initiating redirect...");
      authLogger.debug('AuthContext.signInWithGoogle', 'Starting redirect to Google OAuth');
      
      // Store pre-redirect state for debugging
      sessionStorage.setItem('preRedirectState', JSON.stringify({
        timestamp: Date.now(),
        url: window.location.href,
        hasUser: !!currentUser,
        userId: currentUser?.uid || null,
      }));
      
      // Use signInWithRedirect instead of signInWithPopup
      await signInWithRedirect(auth, provider);
      
      console.log("🔐 REDIRECT DEBUG: Redirect call completed (this may not log if redirect happens immediately)");
      authLogger.info('AuthContext.signInWithGoogle', 'Redirect initiated successfully');
    } catch (error: any) {
      endTimer();
      
      console.error("🔐 REDIRECT DEBUG: Error during sign-in initiation:", error);
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
      console.log("🔐 LOGOUT DEBUG: Starting logout process");
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
    console.log("AuthContext: useEffect triggered. Setting up listener...");
    console.log("🔐 MOUNT DEBUG: Component mounted at:", new Date().toISOString());
    console.log("🔐 MOUNT DEBUG: URL at mount:", window.location.href);
    console.log("🔐 MOUNT DEBUG: URL params:", window.location.search);
    console.log("🔐 MOUNT DEBUG: URL hash:", window.location.hash);
    
    // Check for pre-redirect state
    const preRedirectState = sessionStorage.getItem('preRedirectState');
    if (preRedirectState) {
      try {
        const parsed = JSON.parse(preRedirectState);
        console.log("🔐 REDIRECT DEBUG: Found pre-redirect state:", parsed);
        console.log("🔐 REDIRECT DEBUG: Time since redirect initiation:", Date.now() - parsed.timestamp, "ms");
      } catch (e) {
        console.log("🔐 REDIRECT DEBUG: Failed to parse pre-redirect state");
      }
    } else {
      console.log("🔐 REDIRECT DEBUG: No pre-redirect state found");
    }
    
    authLogger.info('AuthContext.useEffect', 'Setting up auth state and redirect result listener', {
      traceId: authLogger.getTraceId(),
      requestId: authLogger.getRequestId(),
      componentMountTime: componentMountTime.current,
      currentUrl: window.location.href,
      hasPreRedirectState: !!preRedirectState,
    });
    
    // Comprehensive redirect result checking
    const checkRedirectResult = withAuthPerformanceMarker(async () => {
      if (redirectCheckCompleted.current) {
        console.log("🔐 REDIRECT DEBUG: Redirect check already completed, skipping");
        return;
      }
      
      const redirectCheckStartTime = Date.now();
      console.log("🔐 REDIRECT DEBUG: Starting redirect result check at:", new Date().toISOString());
      
      try {
        authLogger.debug('AuthContext.checkRedirectResult', 'Checking for redirect result', {
          url: window.location.href,
          timestamp: redirectCheckStartTime,
          authConfigured: !!auth,
          appConfigured: !!auth?.app,
        });
        
        console.log("🔐 REDIRECT DEBUG: Calling getRedirectResult...");
        const result = await getRedirectResult(auth);
        
        const redirectCheckEndTime = Date.now();
        console.log("🔐 REDIRECT DEBUG: getRedirectResult completed in:", redirectCheckEndTime - redirectCheckStartTime, "ms");
        console.log("🔐 REDIRECT DEBUG: Result:", result);
        
        if (result) {
          console.log("🔐 REDIRECT DEBUG: ✅ SUCCESS! Redirect sign-in result found!");
          console.log("🔐 REDIRECT DEBUG: User:", result.user);
          console.log("🔐 REDIRECT DEBUG: Provider ID:", result.providerId);
          console.log("🔐 REDIRECT DEBUG: Operation type:", result.operationType);
          
          authLogger.info('AuthContext.checkRedirectResult', 'Redirect sign-in successful', {
            userId: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            providerId: result.providerId,
            operationType: result.operationType,
            redirectCheckDuration: redirectCheckEndTime - redirectCheckStartTime,
          });

          // Set user ID for subsequent logs
          authLogger.setUserId(result.user.uid);
          
          await checkAdminStatus(result.user, setIsAdmin);
          
          // Clear pre-redirect state
          sessionStorage.removeItem('preRedirectState');
          
          toast({
            title: "Success",
            description: "You have successfully signed in with Google",
          });
        } else {
          console.log("🔐 REDIRECT DEBUG: ❌ No redirect result found");
          console.log("🔐 REDIRECT DEBUG: This could mean:");
          console.log("  1. User didn't complete the login flow");
          console.log("  2. This is a fresh page load (not from redirect)");
          console.log("  3. The redirect result was already consumed");
          console.log("  4. There was an error during the redirect");
          
          authLogger.debug('AuthContext.checkRedirectResult', 'No redirect result found', {
            url: window.location.href,
            hasPreRedirectState: !!preRedirectState,
            redirectCheckDuration: redirectCheckEndTime - redirectCheckStartTime,
          });
        }
        
        redirectCheckCompleted.current = true;
        console.log("🔐 REDIRECT DEBUG: Marked redirect check as completed");
        
      } catch (error: any) {
        const redirectCheckEndTime = Date.now();
        console.error("🔐 REDIRECT DEBUG: ❌ Error during redirect result check:", error);
        
        authLogger.error('AuthContext.checkRedirectResult', 'Error handling redirect result', {
          errorCode: error?.code,
          errorMessage: error?.message,
          errorStack: error?.stack,
          redirectCheckDuration: redirectCheckEndTime - redirectCheckStartTime,
        });
        
        redirectCheckCompleted.current = true;
        
        toast({
          title: "Sign-in Failed",
          description: "Could not complete sign-in. Please try again.",
          variant: "destructive",
        });
      }
    }, 'checkRedirectResult');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: onAuthStateChanged fired!", { user });
      console.log("🔐 AUTH STATE DEBUG: Auth state changed at:", new Date().toISOString());
      console.log("🔐 AUTH STATE DEBUG: User object:", user);
      console.log("🔐 AUTH STATE DEBUG: User UID:", user?.uid);
      console.log("🔐 AUTH STATE DEBUG: User email:", user?.email);
      console.log("🔐 AUTH STATE DEBUG: Auth initialized:", authInitialized);
      console.log("🔐 AUTH STATE DEBUG: Is loading:", isLoading);
      
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
      console.log("🔐 AUTH STATE DEBUG: Updated currentUser state");
      
      if (user) {
        console.log("🔐 AUTH STATE DEBUG: User is signed in, processing...");
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
        console.log("🔐 AUTH STATE DEBUG: Admin status checked:", isUserAdmin);
        
        // Cache admin status for faster loading using the actual returned value
        if (isUserAdmin) {
          localStorage.setItem('adminStatus', 'true');
          authLogger.debug('AuthContext.onAuthStateChanged', 'Admin status cached');
        } else {
          localStorage.removeItem('adminStatus');
        }
      } else {
        console.log("🔐 AUTH STATE DEBUG: User is signed out, clearing state");
        authLogger.info('AuthContext.onAuthStateChanged', 'User signed out, clearing state');
        setIsAdmin(false);
        localStorage.removeItem('adminStatus');
        localStorage.removeItem('lastAuthCheck');
        authLogger.clearLogs();
      }
      
      if (!authInitialized) {
        console.log("🔐 AUTH STATE DEBUG: Setting auth as initialized");
        setAuthInitialized(true);
        authLogger.info('AuthContext.onAuthStateChanged', 'Auth initialization completed');
      }
      
      console.log("🔐 AUTH STATE DEBUG: Setting loading to false");
      setIsLoading(false);
      
      authStateTimer();
    });

    // Mark auth state listener as setup
    authStateListenerSetup.current = true;
    console.log("🔐 SETUP DEBUG: Auth state listener setup completed");

    // Check redirect result when component mounts - with delay to ensure Firebase is ready
    setTimeout(() => {
      console.log("🔐 REDIRECT DEBUG: Starting delayed redirect check...");
      checkRedirectResult();
    }, 100);

    return () => {
      console.log("🔐 CLEANUP DEBUG: Cleaning up auth context");
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this only runs once

  const value = {
    currentUser,
    isLoading,
    isAdmin,
    authInitialized,
    signInWithGoogle,
    logout,
    refreshUserClaims
  };
  
  console.log("🔐 PROVIDER DEBUG: Rendering AuthProvider with values:", {
    hasCurrentUser: !!currentUser,
    currentUserEmail: currentUser?.email,
    isLoading,
    isAdmin,
    authInitialized,
  });
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
