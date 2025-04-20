
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

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

export default app;

