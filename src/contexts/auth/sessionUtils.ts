
import { User } from "firebase/auth";

export interface SessionInfo {
  sessionId: string | null;
  loginTime: string | null;
  sessionDuration: number;
}

export const getSessionInfo = (): SessionInfo => {
  const sessionId = sessionStorage.getItem('sessionId');
  const loginTime = sessionStorage.getItem('loginTime');
  const sessionDuration = loginTime ? Date.now() - parseInt(loginTime) : 0;
  
  return { sessionId, loginTime, sessionDuration };
};

export const logSessionStart = (user: User, sessionId: string) => {
  console.log("🔥 SIGN IN: ✅ SUCCESS! Popup sign-in completed");
  console.log("🔥 SIGN IN: User:", user);
  console.log("🔥 SIGN IN: User UID:", user.uid);
  console.log("🔥 SIGN IN: User email:", user.email);
};

export const logSessionEnd = (user: User | null, sessionDuration: number) => {
  console.log("🔥 LOGOUT: Starting logout process");
  console.log("🔥 LOGOUT: Session duration:", sessionDuration);
};
