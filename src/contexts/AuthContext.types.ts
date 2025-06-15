
import type { User } from "firebase/auth";

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  authInitialized: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserClaims: () => Promise<void>;
}

