import React, { useState, useEffect, ReactNode, useRef } from "react";
import { 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthContext } from "./AuthContext";
import { AuthContextType } from "./AuthContext.types";
import { checkAdminStatus } from "./authHelpers";
import { authLogger } from "@/utils/authLogger";
import { signInWithGoogle, logout, refreshUserClaims } from "./authService";
import { useSessionManager } from "@/hooks/useSessionManager";

console.log("🔥 AUTH CONTEXT: File loaded at:", new Date().toISOString());

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

  console.log("🔥 AUTH PROVIDER: About to define auth functions");

  const handleSignInWithGoogle = async () => {
    if (!auth) {
      console.error("🔥 AUTH: Cannot sign in - Firebase auth is not initialized");
      console.error("🔥 AUTH: Please check your Firebase configuration and environment variables");
      return;
    }
    await signInWithGoogle();
  };

  const handleLogout = async () => {
    // Clear admin state immediately
    setIsAdmin(false);
    authLogger.debug('AuthProvider.logout', 'Admin state cleared');
    
    if (!auth) {
      console.error("🔥 AUTH: Cannot logout - Firebase auth is not initialized");
      return;
    }
    
    await logout(currentUser);
  };

  const handleRefreshUserClaims = async () => {
    console.log("🔥 AUTH PROVIDER: ================== REFRESHING USER CLAIMS ==================");
    if (!currentUser) {
      console.log("🔥 AUTH PROVIDER: No current user to refresh claims for");
      return;
    }
    
    if (!auth) {
      console.error("🔥 AUTH: Cannot refresh claims - Firebase auth is not initialized");
      return;
    }
    
    try {
      console.log("🔥 AUTH PROVIDER: Forcing token refresh for user:", currentUser.email);
      // Force refresh the ID token to get latest claims
      const idTokenResult = await currentUser.getIdTokenResult(true);
      console.log("🔥 AUTH PROVIDER: Refreshed token claims:", idTokenResult.claims);
      
      // Re-check admin status with fresh token
      await checkAdminStatus(currentUser, setIsAdmin);
      console.log("🔥 AUTH PROVIDER: ✅ User claims refreshed successfully");
    } catch (error) {
      console.error("🔥 AUTH PROVIDER: ❌ Error refreshing user claims:", error);
    }
  };

  useEffect(() => {
    console.log("🔥 USE EFFECT: AuthContext useEffect triggered at:", new Date().toISOString());
    console.log("🔥 USE EFFECT: URL at mount:", window.location.href);
    
    // Check if Firebase auth is initialized
    if (!auth) {
      console.error("🔥 FIREBASE CONFIG ERROR: ================== FIREBASE AUTH NOT INITIALIZED ==================");
      console.error("🔥 FIREBASE CONFIG: Firebase Authentication is not properly configured.");
      console.error("🔥 FIREBASE CONFIG: This is likely due to missing or invalid Firebase environment variables.");
      console.error("🔥 FIREBASE CONFIG: ");
      console.error("🔥 FIREBASE CONFIG: To fix this issue, you need to:");
      console.error("🔥 FIREBASE CONFIG: 1. Go to Firebase Console (https://console.firebase.google.com)");
      console.error("🔥 FIREBASE CONFIG: 2. Select your project or create a new one");
      console.error("🔥 FIREBASE CONFIG: 3. Enable Authentication in the Firebase Console");
      console.error("🔥 FIREBASE CONFIG: 4. Configure your authentication providers (Google, Email/Password, etc.)");
      console.error("🔥 FIREBASE CONFIG: 5. Check that these environment variables are set:");
      console.error("🔥 FIREBASE CONFIG:    - VITE_FIREBASE_API_KEY");
      console.error("🔥 FIREBASE CONFIG:    - VITE_FIREBASE_AUTH_DOMAIN");
      console.error("🔥 FIREBASE CONFIG:    - VITE_FIREBASE_PROJECT_ID");
      console.error("🔥 FIREBASE CONFIG:    - VITE_FIREBASE_STORAGE_BUCKET");
      console.error("🔥 FIREBASE CONFIG:    - VITE_FIREBASE_MESSAGING_SENDER_ID");
      console.error("🔥 FIREBASE CONFIG:    - VITE_FIREBASE_APP_ID");
      console.error("🔥 FIREBASE CONFIG: ");
      console.error("🔥 FIREBASE CONFIG: The app will continue to work but authentication features will be disabled.");
      console.error("🔥 FIREBASE CONFIG: ================== END FIREBASE CONFIG ERROR ==================");
      
      // Set auth as initialized even if it failed, to prevent infinite loading
      setAuthInitialized(true);
      setIsLoading(false);
      return;
    }
    
    authLogger.info('AuthProvider.useEffect', 'Setting up auth state listener', {
      traceId: authLogger.getTraceId(),
      requestId: authLogger.getRequestId(),
      componentMountTime: componentMountTime.current,
      currentUrl: window.location.href,
    });

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("🔥 AUTH STATE: ================== AUTH STATE CHANGED ==================");
        console.log("🔥 AUTH STATE: onAuthStateChanged fired at:", new Date().toISOString());
        console.log("🔥 AUTH STATE: User object exists:", !!user);
        console.log("🔥 AUTH STATE: User UID:", user?.uid);
        console.log("🔥 AUTH STATE: User email:", user?.email);
        console.log("🔥 AUTH STATE: User emailVerified:", user?.emailVerified);
        console.log("🔥 AUTH STATE: Auth initialized:", authInitialized);
        console.log("🔥 AUTH STATE: Is loading:", isLoading);
        
        const authStateTimer = authLogger.startTimer('onAuthStateChanged');
        
        authLogger.info('AuthProvider.onAuthStateChanged', 'Auth state changed', {
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
          console.log("🔥 AUTH STATE: User is signed in, processing admin status...");
          // Set user ID for all subsequent logs
          authLogger.setUserId(user.uid);
          
          // Assert user has required properties
          authLogger.assert(!!user.uid, 'User must have UID');
          authLogger.assert(!!user.email, 'User must have email');
          
          // Enhanced session tracking
          const sessionId = sessionStorage.getItem('sessionId') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          if (!sessionStorage.getItem('sessionId')) {
            sessionStorage.setItem('sessionId', sessionId);
          }
          
          // Persist user session with enhanced security tracking
          const lastAuthCheck = Date.now().toString();
          localStorage.setItem('lastAuthCheck', lastAuthCheck);
          authLogger.debug('AuthProvider.onAuthStateChanged', 'User session persisted', {
            lastAuthCheck,
            sessionId,
            emailVerified: user.emailVerified,
            providerData: user.providerData?.map(p => ({ providerId: p.providerId, uid: p.uid }))
          });
          
          console.log("🔥 AUTH STATE: About to check admin status...");
          const isUserAdmin = await checkAdminStatus(user, setIsAdmin);
          console.log("🔥 AUTH STATE: ✅ Admin status checked:", isUserAdmin);
          
          // Cache admin status for faster loading using the actual returned value
          if (isUserAdmin) {
            localStorage.setItem('adminStatus', 'true');
            authLogger.debug('AuthProvider.onAuthStateChanged', 'Admin status cached');
            console.log("🔥 AUTH STATE: ✅ Admin status cached as true");
          } else {
            localStorage.removeItem('adminStatus');
            console.log("🔥 AUTH STATE: ❌ Admin status not cached (user is not admin)");
          }
        } else {
          console.log("🔥 AUTH STATE: User is signed out, clearing state");
          authLogger.info('AuthProvider.onAuthStateChanged', 'User signed out, clearing state');
          setIsAdmin(false);
          localStorage.removeItem('adminStatus');
          localStorage.removeItem('lastAuthCheck');
          sessionStorage.clear(); // Clear all session data on logout
          authLogger.clearLogs();
        }
        
        if (!authInitialized) {
          console.log("🔥 AUTH STATE: Setting auth as initialized");
          setAuthInitialized(true);
          authLogger.info('AuthProvider.onAuthStateChanged', 'Auth initialization completed');
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
    } catch (error) {
      console.error("🔥 FIREBASE ERROR: Failed to set up auth state listener:", error);
      console.error("🔥 FIREBASE ERROR: This indicates a Firebase configuration problem.");
      console.error("🔥 FIREBASE ERROR: Please check your Firebase setup and environment variables.");
      
      // Ensure the app doesn't get stuck in loading state
      setAuthInitialized(true);
      setIsLoading(false);
    }
  }, []); // Empty dependency array ensures this only runs once

  console.log("🔥 AUTH PROVIDER: About to create context value");
  
  const value: AuthContextType = {
    currentUser,
    isLoading,
    isAdmin,
    authInitialized,
    signInWithGoogle: handleSignInWithGoogle,
    logout: handleLogout,
    refreshUserClaims: handleRefreshUserClaims
  };
  
  console.log("🔥 AUTH PROVIDER: Rendering AuthProvider with values:", {
    hasCurrentUser: !!currentUser,
    currentUserEmail: currentUser?.email,
    isLoading,
    isAdmin,
    authInitialized,
  });
  
  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Session management is handled by components that need it */}
    </AuthContext.Provider>
  );
}
