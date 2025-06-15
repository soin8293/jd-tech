
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
    await signInWithGoogle();
  };

  const handleLogout = async () => {
    // Clear admin state immediately
    setIsAdmin(false);
    authLogger.debug('AuthProvider.logout', 'Admin state cleared');
    
    await logout(currentUser);
  };

  const handleRefreshUserClaims = async () => {
    await refreshUserClaims(currentUser, setIsAdmin);
  };

  useEffect(() => {
    console.log("🔥 USE EFFECT: AuthContext useEffect triggered at:", new Date().toISOString());
    console.log("🔥 USE EFFECT: URL at mount:", window.location.href);
    
    authLogger.info('AuthProvider.useEffect', 'Setting up auth state listener', {
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
        console.log("🔥 AUTH STATE: User is signed in, processing...");
        // Set user ID for all subsequent logs
        authLogger.setUserId(user.uid);
        
        // Assert user has required properties
        authLogger.assert(!!user.uid, 'User must have UID');
        authLogger.assert(!!user.email, 'User must have email');
        
        // Persist user session
        const lastAuthCheck = Date.now().toString();
        localStorage.setItem('lastAuthCheck', lastAuthCheck);
        authLogger.debug('AuthProvider.onAuthStateChanged', 'User session persisted', {
          lastAuthCheck,
        });
        
        const isUserAdmin = await checkAdminStatus(user, setIsAdmin);
        console.log("🔥 AUTH STATE: Admin status checked:", isUserAdmin);
        
        // Cache admin status for faster loading using the actual returned value
        if (isUserAdmin) {
          localStorage.setItem('adminStatus', 'true');
          authLogger.debug('AuthProvider.onAuthStateChanged', 'Admin status cached');
        } else {
          localStorage.removeItem('adminStatus');
        }
      } else {
        console.log("🔥 AUTH STATE: User is signed out, clearing state");
        authLogger.info('AuthProvider.onAuthStateChanged', 'User signed out, clearing state');
        setIsAdmin(false);
        localStorage.removeItem('adminStatus');
        localStorage.removeItem('lastAuthCheck');
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
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
