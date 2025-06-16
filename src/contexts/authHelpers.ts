
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
    console.log('🔐 AUTH: Checking admin status for user:', user.email);
    
    // PRIORITY: Always grant admin for amirahcolorado@gmail.com regardless of environment
    if (user.email === 'amirahcolorado@gmail.com') {
      console.log('🔐 AUTH: ✅ Super admin detected, granting full admin privileges');
      setIsAdmin(true);
      return true;
    }
    
    // SECURITY: Development environment bypass for testing
    if (isDevelopmentEnvironment() && user.email === 'amirahcolorado@gmail.com') {
      console.log('🔐 AUTH: ✅ Development environment detected for authorized user, enabling admin mode');
      setIsAdmin(true);
      return true;
    }
    
    console.log('🔐 AUTH: Getting ID token to check admin claims...');
    const idTokenResult = await user.getIdTokenResult();
    console.log('🔐 AUTH: ID Token received:', {
      claims: idTokenResult.claims,
      hasAdminClaim: !!idTokenResult.claims.admin,
      token: idTokenResult.token?.substring(0, 50) + '...',
      expirationTime: idTokenResult.expirationTime,
      issuedAtTime: idTokenResult.issuedAtTime
    });
    
    const hasAdminClaim = !!idTokenResult.claims.admin;
    console.log('🔐 AUTH: Admin status determined:', { hasAdminClaim, claims: idTokenResult.claims });
    setIsAdmin(hasAdminClaim);
    return hasAdminClaim;
  } catch (error) {
    console.error("🔐 AUTH: ❌ Error checking admin status:", error);
    console.error("🔐 AUTH: Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      stack: (error as any)?.stack
    });
    
    // Fallback: If there's any error and user is amirahcolorado@gmail.com, grant admin
    if (user.email === 'amirahcolorado@gmail.com') {
      console.log('🔐 AUTH: ⚠️ Error occurred but granting admin for super admin user');
      setIsAdmin(true);
      return true;
    }
    
    setIsAdmin(false);
    return false;
  }
}
