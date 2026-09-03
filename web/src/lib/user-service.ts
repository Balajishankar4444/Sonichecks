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
  const currentMonth = new Date().toISOString().slice(0, 7);
  const nowIso = new Date().toISOString();

  // If Firestore is not initialized or offline, return cached local plan
  if (!db || !user.uid) {
    const localUsage = getUsageState(user.email || undefined);
    if (onPlanChanged) onPlanChanged(localUsage.plan);
    return { plan: localUsage.plan };
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    let activePlan: 'free' | 'pro' | 'studio' = 'free';

    if (snap.exists()) {
      const data = snap.data() as FirestoreUserProfile;
      activePlan = data.plan || 'free';

      // Update lastLoginAt timestamp
      await updateDoc(userDocRef, {
        lastLoginAt: nowIso,
        updatedAt: nowIso,
        email: user.email || data.email,
        displayName: user.displayName || data.displayName || null
      }).catch(console.warn);

    } else {
      // First-time user document creation in Firestore
      // Check if user already had a paid plan in local storage or Creem
      const localUsage = getUsageState(user.email || undefined);
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

      await setDoc(userDocRef, newProfile).catch(console.warn);
    }

    // Sync to local storage for instant offline / client-side retrieval
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
  
  // 1. Update local storage & dispatch global update event
  updatePlan(plan, email);

  // 2. Persist to Firestore if available
  if (db && uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
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
