import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

export function getAdminFirestore(): Firestore | null {
  if (adminDb) return adminDb;

  try {
    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sonichecks-f7e58';
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey) {
        // Robust handling for Vercel environment variables: strip quotes and convert escaped newlines
        privateKey = privateKey.trim();
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
          privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      if (clientEmail && privateKey) {
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey
          })
        });
      } else {
        // Fallback for default Google Cloud credential
        adminApp = initializeApp({ projectId });
      }
    } else {
      adminApp = getApps()[0];
    }

    if (adminApp) {
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
    }
    return adminDb;
  } catch (err) {
    console.error('Firebase Admin initialization error:', err);
    return null;
  }
}

export { adminDb, adminAuth };
