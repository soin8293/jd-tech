
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase config is valid
const isFirebaseConfigValid = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  return requiredFields.every(field => firebaseConfig[field as keyof typeof firebaseConfig]);
};

// Initialize Firebase only if config is valid
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let functions: any = null;

if (isFirebaseConfigValid()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.warn('Firebase configuration is incomplete. Please check your environment variables.');
  console.warn('Missing environment variables. Expected: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.');
}

// Export with fallbacks
export { auth, db, storage, functions };

// Firebase Storage configuration
const configureCORS = async () => {
  try {
    if (storage) {
      // Storage CORS is configured via Firebase Console or gsutil
      // This is just a placeholder for any future storage configuration
      console.log('Firebase Storage initialized');
    }
  } catch (error) {
    console.warn('Storage configuration warning:', error);
  }
};

// Initialize storage configuration only if Firebase is properly configured
if (app) {
  configureCORS();
}
