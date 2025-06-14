
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
console.log("🚀 FIREBASE DEBUG: Initializing Firebase with config:", firebaseConfig);
const app = initializeApp(firebaseConfig);
console.log("🚀 FIREBASE DEBUG: Firebase app initialized:", app);
console.log("🚀 FIREBASE DEBUG: App name:", app.name);
console.log("🚀 FIREBASE DEBUG: App options:", app.options);

// Initialize Firebase services
console.log("🚀 FIREBASE DEBUG: Initializing Auth service...");
export const auth = getAuth(app);
console.log("🚀 FIREBASE DEBUG: Auth initialized:", auth);
console.log("🚀 FIREBASE DEBUG: Auth app:", auth.app);

console.log("🚀 FIREBASE DEBUG: Initializing Firestore service...");
export const db = getFirestore(app);
console.log("🚀 FIREBASE DEBUG: Firestore initialized:", db);
console.log("🚀 FIREBASE DEBUG: Firestore app:", db.app);
console.log("🚀 FIREBASE DEBUG: Firestore type:", db.type);

console.log("🚀 FIREBASE DEBUG: Initializing Functions service...");
export const functions = getFunctions(app, "us-central1");
console.log("🚀 FIREBASE DEBUG: Functions initialized:", functions);
console.log("🚀 FIREBASE DEBUG: Functions region:", functions.region);

// Connect to Functions emulator in development
if (window.location.hostname === 'localhost') {
  // Uncomment and set correct ports for local emulator testing
  // connectFunctionsEmulator(functions, "localhost", 5001);
  console.log("🔧 FIREBASE DEBUG: Running in development mode. Functions will use production endpoints.");
} else {
  console.log("🌐 FIREBASE DEBUG: Running in production mode.");
}

export default app;
