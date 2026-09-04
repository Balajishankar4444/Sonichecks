import { doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { updatePlan, getUsageState } from './storage';

export interface FirestoreUserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  plan: 'free' | 'pro' | 'studio';
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Record user login time and fetch their subscription plan (Free, Pro, or Studio) from Firestore.
 */
export async function syncUserWithFirestore(
  user: { uid: string; email: string | null; displayName?: string | null },
  onPlanChanged?: (plan: 'free' | 'pro' | 'studio') => void
): Promise<{ plan: 'free' | 'pro' | 'studio'; unsubscribe?: Unsubscribe }> {
  const nowIso = new Date().toISOString();
  const cleanEmail = user.email ? user.email.toLowerCase().trim() : null;
  const docId = cleanEmail || user.uid;

  if (!db || !docId) {
    const localUsage = getUsageState(user.email || undefined);
    if (onPlanChanged) onPlanChanged(localUsage.plan);
    return { plan: localUsage.plan };
  }

  try {
    const userDocRef = doc(db, 'users', docId);
    const snap = await getDoc(userDocRef);

    const localUsage = getUsageState(user.email || undefined);
    let activePlan: 'free' | 'pro' | 'studio' = 'free';

    if (snap.exists()) {
      const data = snap.data() as FirestoreUserProfile;
      // Elevate to Studio if either Firestore or local state has Studio
      if (localUsage.plan === 'studio' || data.plan === 'studio') {
        activePlan = 'studio';
      } else if (localUsage.plan === 'pro' || data.plan === 'pro') {
        activePlan = 'pro';
      } else {
        activePlan = data.plan || 'free';
      }

      await setDoc(userDocRef, {
        plan: activePlan,
        lastLoginAt: nowIso,
        updatedAt: nowIso,
        email: user.email || data.email,
        displayName: user.displayName || data.displayName || null
      }, { merge: true }).catch(console.warn);

    } else {
      activePlan = localUsage.plan !== 'free' ? localUsage.plan : 'free';

      const newProfile: FirestoreUserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        plan: activePlan,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        updatedAt: nowIso
      };

      await setDoc(userDocRef, newProfile, { merge: true }).catch(console.warn);
    }

    // Sync to local storage
    updatePlan(activePlan, user.email || undefined);
    if (onPlanChanged) onPlanChanged(activePlan);

    // Attach real-time Firestore snapshot listener
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const liveData = docSnap.data() as FirestoreUserProfile;
        if (liveData && liveData.plan) {
          updatePlan(liveData.plan, user.email || undefined);
          if (onPlanChanged) onPlanChanged(liveData.plan);
        }
      }
    }, (err) => {
      console.warn('Firestore real-time plan listener notice:', err);
    });

    return { plan: activePlan, unsubscribe };

  } catch (err) {
    console.warn('Firestore sync notice:', err);
    const localUsage = getUsageState(user.email || undefined);
    if (onPlanChanged) onPlanChanged(localUsage.plan);
    return { plan: localUsage.plan };
  }
}

/**
 * Updates a user's subscription tier in Firestore and local storage.
 */
export async function updateUserPlanInFirestore(
  uid: string,
  plan: 'free' | 'pro' | 'studio',
  email?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  const cleanEmail = email ? email.toLowerCase().trim() : null;
  const docId = cleanEmail || uid;
  
  updatePlan(plan, email);

  if (db && docId) {
    try {
      const userDocRef = doc(db, 'users', docId);
      await setDoc(userDocRef, {
        uid,
        plan,
        email: email || null,
        updatedAt: nowIso
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to update plan in Firestore:', e);
    }
  }
}
