
import type { User } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export function isDevelopmentEnvironment() {
  const hostname = window.location.hostname;
  const validDomains = [
    'localhost',
    'lovableproject.com',
    'jd-suites-backend.web.app',
    'jd-suites-backend.firebaseapp.com',
    'c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com',
    'id-preview--c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovable.app'
  ];
  console.log('Current hostname:', hostname);
  const isDev = validDomains.some(domain => hostname.includes(domain));
  console.log('Environment check:', { hostname, isDev, validDomains });
  return isDev;
}

export async function checkAdminStatus(user: User, setIsAdmin: (v: boolean) => void) {
  try {
    console.log('Checking admin status for user:', user.email);
    if (isDevelopmentEnvironment()) {
      console.log('Development environment detected, enabling admin mode');
      setIsAdmin(true);
      return true;
    }
    const idTokenResult = await user.getIdTokenResult();
    const hasAdminClaim = !!idTokenResult.claims.admin;
    console.log('Admin status:', { hasAdminClaim, claims: idTokenResult.claims });
    setIsAdmin(hasAdminClaim);
    return hasAdminClaim;
  } catch (error) {
    console.error("Error checking admin status:", error);
    setIsAdmin(false);
    return false;
  }
}
