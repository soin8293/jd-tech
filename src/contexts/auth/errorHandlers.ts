
import { toast } from "@/hooks/use-toast";
import { authLogger } from "@/utils/authLogger";

export const handleSignInError = (error: any, sessionId: string) => {
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
};

export const handleLogoutError = (error: any, currentUser: any) => {
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
};

export const handleRefreshClaimsError = (error: any, currentUser: any) => {
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
};
