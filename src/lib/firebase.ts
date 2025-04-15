
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD_L85YeBjRR9OQ_orY_c4byLXTqupfxJc",
  authDomain: "stay-scout-navigator.firebaseapp.com",
  projectId: "stay-scout-navigator",
  storageBucket: "stay-scout-navigator.appspot.com",
  messagingSenderId: "654321654321",
  appId: "1:654321654321:web:abc123def456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
