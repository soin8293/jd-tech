
import { createContext } from "react";
import { AuthContextType } from "./AuthContext.types";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Re-export everything from the provider and hook
export { AuthProvider } from "./AuthProvider";
export { useAuth } from "./useAuth";
export type { AuthContextType } from "./AuthContext.types";
