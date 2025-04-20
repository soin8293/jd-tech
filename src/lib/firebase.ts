
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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Connect to Functions emulator in development
if (window.location.hostname === 'localhost') {
  // Uncomment and set correct ports for local emulator testing
  // connectFunctionsEmulator(functions, "localhost", 5001);
  console.log("Running in development mode. Functions emulator is available but not connected.");
}

export default app;
