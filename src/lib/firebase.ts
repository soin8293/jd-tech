
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEOMvNQtNC4GCoffyr0LR_v1b78093HAM",
  authDomain: "jd-suites-backend.firebaseapp.com",
  projectId: "jd-suites-backend",
  storageBucket: "jd-suites-backend.firebasestorage.app",
  messagingSenderId: "754152210086",
  appId: "1:754152210086:web:d08d83743e39ded4b9fe67"
};

// Initialize Firebase
console.log("🚀 FIREBASE DEBUG: ================ FIREBASE INITIALIZATION ================");
console.log("🚀 FIREBASE DEBUG: Timestamp:", new Date().toISOString());
console.log("🚀 FIREBASE DEBUG: Environment:", {
  isDevelopment: window.location.hostname === 'localhost',
  hostname: window.location.hostname,
  origin: window.location.origin,
  protocol: window.location.protocol,
  userAgent: navigator.userAgent
});
console.log("🚀 FIREBASE DEBUG: Config object:", firebaseConfig);
console.log("🚀 FIREBASE DEBUG: Config validation:", {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasAuthDomain: !!firebaseConfig.authDomain,
  apiKeyLength: firebaseConfig.apiKey?.length,
  projectIdLength: firebaseConfig.projectId?.length
});

const app = initializeApp(firebaseConfig);
console.log("🚀 FIREBASE DEBUG: Firebase app initialized:", app);
console.log("🚀 FIREBASE DEBUG: App details:", {
  name: app.name,
  automaticDataCollectionEnabled: app.automaticDataCollectionEnabled,
  options: app.options
});

// Initialize Firebase services
console.log("🚀 FIREBASE DEBUG: Initializing Auth service...");
export const auth = getAuth(app);
console.log("🚀 FIREBASE DEBUG: Auth initialized:", {
  app: auth.app.name,
  config: auth.config,
  currentUser: auth.currentUser,
  name: auth.name
});

console.log("🚀 FIREBASE DEBUG: Initializing Firestore service...");
export const db = getFirestore(app);
console.log("🚀 FIREBASE DEBUG: Firestore initialized:", {
  app: db.app.name,
  type: db.type,
  toJSON: typeof db.toJSON
});

console.log("🚀 FIREBASE DEBUG: Initializing Functions service...");
export const functions = getFunctions(app, "us-central1");
console.log("🚀 FIREBASE DEBUG: Functions initialized:", {
  app: functions.app.name,
  region: functions.region,
  customDomain: functions.customDomain,
  constructor: functions.constructor.name
});

// Additional Functions debugging
console.log("🚀 FIREBASE DEBUG: Functions detailed analysis:", {
  functionsObject: functions,
  functionsKeys: Object.keys(functions),
  functionsPrototype: Object.getPrototypeOf(functions),
  functionsDescriptors: Object.getOwnPropertyDescriptors(functions),
  functionsStringified: functions.toString()
});

// Test function availability
console.log("🚀 FIREBASE DEBUG: Testing function URLs...");
const testUrls = [
  "https://us-central1-jd-suites-backend.cloudfunctions.net/createPaymentIntent",
  "https://us-central1-jd-suites-backend.cloudfunctions.net/processBooking",
  "https://us-central1-jd-suites-backend.cloudfunctions.net/sanityCheck"
];

testUrls.forEach(async (url, index) => {
  try {
    console.log(`🚀 FIREBASE DEBUG: Testing URL ${index + 1}:`, url);
    const response = await fetch(url, { method: 'GET' });
    console.log(`🚀 FIREBASE DEBUG: URL ${index + 1} response:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error(`🚀 FIREBASE DEBUG: URL ${index + 1} failed:`, error);
  }
});

// Connect to Functions emulator in development
if (window.location.hostname === 'localhost') {
  // Uncomment and set correct ports for local emulator testing
  // connectFunctionsEmulator(functions, "localhost", 5001);
  console.log("🔧 FIREBASE DEBUG: Running in development mode. Functions will use production endpoints.");
  console.log("🔧 FIREBASE DEBUG: To use emulator, uncomment connectFunctionsEmulator line");
} else {
  console.log("🌐 FIREBASE DEBUG: Running in production mode.");
}

// Test functions endpoint construction
console.log("🚀 FIREBASE DEBUG: Functions endpoint testing:", {
  expectedRegion: "us-central1",
  expectedProjectId: "jd-suites-backend",
  expectedBaseUrl: `https://us-central1-jd-suites-backend.cloudfunctions.net`,
  actualRegion: functions.region,
  actualProjectId: functions.app.options.projectId
});

export default app;
