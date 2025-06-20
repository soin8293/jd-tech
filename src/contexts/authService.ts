import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { checkAdminStatus } from "./authHelpers";
import { authLogger, withAuthPerformanceMarker } from "@/utils/authLogger";

// Generate session ID for tracking
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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

    const provider = new GoogleAuthProvider();
    
    // Add additional scopes for better user info
    provider.addScope('email');
    provider.addScope('profile');
    
    // Set custom parameters for enhanced security
    provider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'offline'
    });
    
    console.log("🔥 SIGN IN: Provider configured, calling signInWithPopup...");
    authLogger.debug('AuthService.signInWithGoogle', 'Starting popup sign-in');
    
    const result = await signInWithPopup(auth, provider);
    
    console.log("🔥 SIGN IN: ✅ SUCCESS! Popup sign-in completed");
    console.log("🔥 SIGN IN: User:", result.user);
    console.log("🔥 SIGN IN: User UID:", result.user.uid);
    console.log("🔥 SIGN IN: User email:", result.user.email);
    
    // Store session information
    sessionStorage.setItem('sessionId', sessionId);
    sessionStorage.setItem('loginTime', Date.now().toString());
    localStorage.setItem('lastSuccessfulLogin', Date.now().toString());
    
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
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('loginTime');
    
    console.error("🔥 SIGN IN ERROR:", error);
    console.error("🔥 SIGN IN ERROR code:", error?.code);
    console.error("🔥 SIGN IN ERROR message:", error?.message);
    
    authLogger.error('AuthService.signInWithGoogle', 'Google sign-in failed', {
      errorCode: error?.code,
      errorMessage: error?.message,
      errorStack: error?.stack,
      domain: window.location.hostname,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId
    });
    
    let errorMessage = "Could not sign in with Google. Please try again.";
    
    // Enhanced error handling with security considerations
    if (error?.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      errorMessage = `Authentication Error: This domain (${currentDomain}) is not authorized in Firebase.`;
      
      authLogger.error('AuthService.signInWithGoogle', 'Unauthorized domain error', {
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
      authLogger.warn('AuthService.signInWithGoogle', 'User cancelled sign-in');
    } else if (error?.code === 'auth/network-request-failed') {
      errorMessage = "Network error. Please check your internet connection.";
      authLogger.error('AuthService.signInWithGoogle', 'Network error during sign-in');
    } else if (error?.code === 'auth/popup-blocked') {
      errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
      authLogger.error('AuthService.signInWithGoogle', 'Popup blocked by browser');
    } else if (error?.code === 'auth/account-exists-with-different-credential') {
      errorMessage = "An account already exists with a different sign-in method.";
      authLogger.error('AuthService.signInWithGoogle', 'Account conflict error');
    }
    
    toast({
      title: "Sign-in Failed",
      description: errorMessage,
      variant: "destructive",
    });
    
    throw error;
  }
}, 'signInWithGoogle');

export const logout = withAuthPerformanceMarker(async (currentUser: User | null) => {
  const endTimer = authLogger.startTimer('logout');
  
  try {
    console.log("🔥 LOGOUT: Starting logout process");
    const sessionId = sessionStorage.getItem('sessionId');
    const loginTime = sessionStorage.getItem('loginTime');
    const sessionDuration = loginTime ? Date.now() - parseInt(loginTime) : 0;
    
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
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('loginTime');
    
    // Clear any cached data or local storage (preserve long-term preferences)
    localStorage.removeItem('adminStatus');
    localStorage.removeItem('lastAuthCheck');
    
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
    
    authLogger.error('AuthService.logout', 'Logout failed', {
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
    
    authLogger.error('AuthService.refreshUserClaims', 'Failed to refresh claims', {
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
