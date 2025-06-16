
import type { User } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export function isDevelopmentEnvironment() {
  const hostname = window.location.hostname;
  // SECURITY: More restrictive development domains
  const validDomains = [
    'localhost',
    'c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com',
    'id-preview--c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovable.app'
  ];
  console.log('Current hostname:', hostname);
  const isDev = validDomains.some(domain => hostname === domain);
  console.log('Environment check:', { hostname, isDev, validDomains });
  return isDev;
}

export async function checkAdminStatus(user: User, setIsAdmin: (v: boolean) => void) {
  try {
    console.log('Checking admin status for user:', user.email);
    
    // PRIORITY: Always grant admin for amirahcolorado@gmail.com regardless of environment
    if (user.email === 'amirahcolorado@gmail.com') {
      console.log('Super admin detected, granting full admin privileges');
      setIsAdmin(true);
      return true;
    }
    
    // SECURITY: Development environment bypass for testing
    if (isDevelopmentEnvironment() && user.email === 'amirahcolorado@gmail.com') {
      console.log('Development environment detected for authorized user, enabling admin mode');
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
    
    // Fallback: If there's any error and user is amirahcolorado@gmail.com, grant admin
    if (user.email === 'amirahcolorado@gmail.com') {
      console.log('Error occurred but granting admin for super admin user');
      setIsAdmin(true);
      return true;
    }
    
    setIsAdmin(false);
    return false;
  }
}
