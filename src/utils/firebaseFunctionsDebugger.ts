
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";

export const debugFirebaseFunctions = async () => {
  console.log("🔧 FUNCTIONS_DEBUG: ================ FIREBASE FUNCTIONS DIAGNOSTICS ================");
  
  // Check if Firebase is properly initialized
  if (!auth || !functions) {
    console.error("🔧 FUNCTIONS_DEBUG: Firebase is not properly initialized. Check your Firebase configuration.");
    console.error("🔧 FUNCTIONS_DEBUG: Missing environment variables or invalid configuration.");
    console.error("🔧 FUNCTIONS_DEBUG: Please ensure all Firebase environment variables are set correctly.");
    return;
  }
  
  // 1. Check if functions are properly initialized
  console.log("🔧 FUNCTIONS_DEBUG: Functions instance:", {
    region: functions.region,
    app: functions.app.name,
    customDomain: functions.customDomain
  });
  
  // 2. Check authentication status
  const currentUser = auth.currentUser;
  console.log("🔧 FUNCTIONS_DEBUG: Authentication status:", {
    isAuthenticated: !!currentUser,
    userId: currentUser?.uid,
    email: currentUser?.email,
    hasIdToken: !!currentUser
  });
  
  // 3. Try to get ID token
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      const tokenResult = await currentUser.getIdTokenResult();
      console.log("🔧 FUNCTIONS_DEBUG: ID Token acquired:", {
        tokenLength: idToken.length,
        tokenPrefix: idToken.substring(0, 20) + '...',
        expirationTime: tokenResult.expirationTime,
        issuedAtTime: tokenResult.issuedAtTime
      });
    } catch (error) {
      console.error("🔧 FUNCTIONS_DEBUG: Failed to get ID token:", error);
    }
  }
  
  // 4. Test function endpoint manually
  const functionUrl = "https://us-central1-jd-suites-backend.cloudfunctions.net/createPaymentIntent";
  console.log("🔧 FUNCTIONS_DEBUG: Testing function endpoint manually...");
  
  try {
    let authHeader = '';
    
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        authHeader = `Bearer ${token}`;
      } catch (tokenError) {
        console.warn("🔧 FUNCTIONS_DEBUG: Failed to get auth token:", tokenError);
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          rooms: [{ id: "test", name: "Test Room", price: 100 }],
          period: { checkIn: new Date().toISOString(), checkOut: new Date().toISOString() },
          guests: 2,
          transaction_id: "test_transaction",
          currency: "usd"
        }
      })
    });
    
    console.log("🔧 FUNCTIONS_DEBUG: Manual fetch response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("🔧 FUNCTIONS_DEBUG: Manual fetch data:", data);
    } else {
      const errorText = await response.text();
      console.error("🔧 FUNCTIONS_DEBUG: Manual fetch error:", errorText);
    }
  } catch (fetchError) {
    console.error("🔧 FUNCTIONS_DEBUG: Manual fetch failed:", fetchError);
  }
  
  // 5. Test with httpsCallable
  console.log("🔧 FUNCTIONS_DEBUG: Testing with httpsCallable...");
  try {
    const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
    const result = await createPaymentIntent({
      rooms: [{ id: "test", name: "Test Room", price: 100 }],
      period: { checkIn: new Date().toISOString(), checkOut: new Date().toISOString() },
      guests: 2,
      transaction_id: "test_transaction",
      currency: "usd"
    });
    
    console.log("🔧 FUNCTIONS_DEBUG: httpsCallable success:", result);
  } catch (callableError) {
    console.error("🔧 FUNCTIONS_DEBUG: httpsCallable failed:", callableError);
  }
  
  console.log("🔧 FUNCTIONS_DEBUG: ================ END DIAGNOSTICS ================");
};

// Auto-run diagnostics when this module is imported - but only if Firebase is configured
if (auth && functions) {
  debugFirebaseFunctions();
}
