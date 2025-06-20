
import { GoogleAuthProvider } from "firebase/auth";

// Generate session ID for tracking
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Configure Google Auth Provider
export const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  
  // Add additional scopes for better user info
  provider.addScope('email');
  provider.addScope('profile');
  
  // Set custom parameters for enhanced security
  provider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'offline'
  });
  
  return provider;
};

// Session storage utilities
export const storeSessionData = (sessionId: string) => {
  sessionStorage.setItem('sessionId', sessionId);
  sessionStorage.setItem('loginTime', Date.now().toString());
  localStorage.setItem('lastSuccessfulLogin', Date.now().toString());
};

export const clearSessionData = () => {
  sessionStorage.removeItem('sessionId');
  sessionStorage.removeItem('loginTime');
  localStorage.removeItem('adminStatus');
  localStorage.removeItem('lastAuthCheck');
};

export const getSessionDuration = (): number => {
  const loginTime = sessionStorage.getItem('loginTime');
  return loginTime ? Date.now() - parseInt(loginTime) : 0;
};
