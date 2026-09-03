import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();

export function isFirebaseConfigured(): boolean {
  return typeof window !== 'undefined' && Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);
}

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (err) {
  // Gracefully handle build-time or invalid key environments without breaking prerender
  console.warn('Firebase initialization skipped or running in mock environment:', err);
}

export { app, auth, googleProvider };
