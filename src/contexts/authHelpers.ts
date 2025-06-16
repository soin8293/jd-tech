
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
    
    // SECURITY: Only allow dev bypass for exact localhost AND specific email
    if (window.location.hostname === 'localhost' && user.email === 'amirahcolorado@gmail.com') {
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
    setIsAdmin(false);
    return false;
  }
}
