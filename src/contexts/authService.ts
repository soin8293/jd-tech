
import { 
  signInWithPopup,
  signOut, 
  User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { checkAdminStatus } from "./authHelpers";
import { authLogger, withAuthPerformanceMarker } from "@/utils/authLogger";
import { 
  generateSessionId, 
  createGoogleProvider, 
  storeSessionData, 
  clearSessionData 
} from "./auth/authUtils";
import { getSessionInfo, logSessionStart, logSessionEnd } from "./auth/sessionUtils";
import { 
  handleSignInError, 
  handleLogoutError, 
  handleRefreshClaimsError 
} from "./auth/errorHandlers";

export const signInWithGoogle = withAuthPerformanceMarker(async () => {
  console.log("🔥 SIGN IN: signInWithGoogle function called at:", new Date().toISOString());
  
  const endTimer = authLogger.startTimer('signInWithGoogle');
  const sessionId = generateSessionId();
  
  try {
    console.log("🔥 SIGN IN ATTEMPT: Starting Google sign-in process with popup");
    console.log("🔥 SIGN IN: Current URL:", window.location.href);
    
    authLogger.info('AuthService.signInWithGoogle', 'Initiating Google sign-in with popup', {
      domain: window.location.hostname,
      authDomain: auth.app.options.authDomain,
      projectId: auth.app.options.projectId,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      sessionId
    });

    // Assert Firebase is properly initialized
    authLogger.assert(!!auth, 'Firebase auth must be initialized');
    authLogger.assert(!!auth.app, 'Firebase app must be available');

    const provider = createGoogleProvider();
    
    console.log("🔥 SIGN IN: Provider configured, calling signInWithPopup...");
    authLogger.debug('AuthService.signInWithGoogle', 'Starting popup sign-in');
    
    const result = await signInWithPopup(auth, provider);
    
    logSessionStart(result.user, sessionId);
    
    // Store session information
    storeSessionData(sessionId);
    
    authLogger.info('AuthService.signInWithGoogle', 'Popup sign-in successful', {
      userId: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      providerId: result.providerId,
      operationType: result.operationType,
      sessionId,
      emailVerified: result.user.emailVerified
    });

    // Set user ID for subsequent logs
    authLogger.setUserId(result.user.uid);
    
    toast({
      title: "Success",
      description: "You have successfully signed in with Google",
    });
    
    endTimer();
  } catch (error: any) {
    endTimer();
    
    // Clear any partial session data
    clearSessionData();
    
    handleSignInError(error, sessionId);
    throw error;
  }
}, 'signInWithGoogle');

export const logout = withAuthPerformanceMarker(async (currentUser: User | null) => {
  const endTimer = authLogger.startTimer('logout');
  
  try {
    const { sessionId, sessionDuration } = getSessionInfo();
    
    logSessionEnd(currentUser, sessionDuration);
    
    authLogger.info('AuthService.logout', 'Starting logout process', {
      userId: currentUser?.uid,
      email: currentUser?.email,
      currentPath: window.location.pathname,
      sessionId,
      sessionDuration
    });

    // Assert user exists before logout
    authLogger.assert(!!currentUser, 'User must be logged in to logout');
    
    // Clear session data
    clearSessionData();
    
    authLogger.debug('AuthService.logout', 'Session data cleared');
    
    // Sign out from Firebase
    await signOut(auth);
    authLogger.info('AuthService.logout', 'Firebase sign-out completed', {
      sessionDuration,
      finalPath: window.location.pathname
    });
    
    // Redirect to home page after logout
    if (window.location.pathname === '/room-management') {
      authLogger.info('AuthService.logout', 'Redirecting from room-management to home');
      window.location.href = '/';
    }
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    
    endTimer();
  } catch (error: any) {
    endTimer();
    handleLogoutError(error, currentUser);
  }
}, 'logout');

export const refreshUserClaims = withAuthPerformanceMarker(async (currentUser: User | null, setIsAdmin: (v: boolean) => void) => {
  if (!currentUser) {
    authLogger.warn('AuthService.refreshUserClaims', 'No current user to refresh claims for');
    return;
  }

  const endTimer = authLogger.startTimer('refreshUserClaims');
  
  try {
    authLogger.info('AuthService.refreshUserClaims', 'Starting claims refresh', {
      userId: currentUser.uid,
      email: currentUser.email,
    });

    await currentUser.getIdToken(true);
    authLogger.debug('AuthService.refreshUserClaims', 'ID token refreshed');
    
    const isUserAdmin = await checkAdminStatus(currentUser, setIsAdmin);
    authLogger.info('AuthService.refreshUserClaims', 'Claims refreshed successfully', {
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
    handleRefreshClaimsError(error, currentUser);
  }
}, 'refreshUserClaims');
