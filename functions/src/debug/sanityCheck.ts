
import { onCall } from "firebase-functions/v2/https";

const sanityCheckHandler = async (request: any) => {
  console.log("🩺 SANITY_CHECK: Function called successfully");
  console.log("🩺 SANITY_CHECK: Request data:", JSON.stringify(request.data, null, 2));
  console.log("🩺 SANITY_CHECK: Environment check:", {
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0
  });
  
  return {
    success: true,
    message: "Sanity check passed!",
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY
    }
  };
};

export const sanityCheck = onCall({
  cors: {
    origin: [
      "https://jd-suites-backend.web.app",
      "https://jd-suites-backend.firebaseapp.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://c09097ef-16d0-43bf-b1c5-ea78455f9bda.lovableproject.com"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey"]
  }
}, sanityCheckHandler);
