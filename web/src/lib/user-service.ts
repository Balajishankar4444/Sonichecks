import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { updatePlan, getUsageState } from './storage';

export interface FirestoreUserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  plan?: 'free' | 'pro' | 'studio';
  tier?: 'FREE' | 'PRO' | 'STUDIO';
  status?: 'active' | 'expired' | 'cancelled';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  resetDate?: string;
  daysRemaining?: number;
  filesChecked?: number;
  monthlyAllowance?: number;
  lastLoginAt: string;
  createdAt?: string;
  updatedAt: string;
}

/**
 * Record user login time and fetch their full subscription data (plan, subscriptionEndDate, status, quota) from Firestore.
 * Preserves whatever is manually edited in the Firebase console for seamless backend testing.
 */
export async function syncUserWithFirestore(
  user: { uid: string; email: string | null; displayName?: string | null },
  onUserDataChanged?: (data: Partial<FirestoreUserProfile>) => void
): Promise<{ profile: Partial<FirestoreUserProfile>; unsubscribe?: Unsubscribe }> {
  const nowIso = new Date().toISOString();
  const cleanEmail = user.email ? user.email.toLowerCase().trim() : null;
  const docId = cleanEmail || user.uid;

  if (!db || !docId) {
    const localUsage = getUsageState(user.email || undefined);
    const fallbackProfile: Partial<FirestoreUserProfile> = {
      plan: localUsage.plan,
      tier: localUsage.plan.toUpperCase() as any,
      status: 'active'
    };
    if (onUserDataChanged) onUserDataChanged(fallbackProfile);
    return { profile: fallbackProfile };
  }

  try {
    const userDocRef = doc(db, 'users', docId);
    const snap = await getDoc(userDocRef);

    let resultProfile: Partial<FirestoreUserProfile> = {};

    if (snap.exists()) {
      const data = snap.data() as Partial<FirestoreUserProfile>;
      
      const rawPlan = data.plan || 'free';
      const subscriptionStartDate = data.subscriptionStartDate || data.createdAt || nowIso;
      const subscriptionEndDate = data.subscriptionEndDate;
      const resetDate = data.resetDate || subscriptionEndDate;
      const filesChecked = data.filesChecked ?? 0;

      const isExpired = subscriptionEndDate ? new Date(subscriptionEndDate).getTime() <= Date.now() : false;
      const plan = isExpired ? 'free' : rawPlan;
      const tier = (plan.toUpperCase() as any);
      const status = isExpired ? 'expired' : (data.status || 'active');
      const monthlyAllowance = isExpired ? 5 : (data.monthlyAllowance ?? (plan === 'studio' ? 999999 : plan === 'pro' ? 100 : 5));

      let daysRemaining = 0;
      if (subscriptionEndDate && !isExpired) {
        const endMs = new Date(subscriptionEndDate).getTime();
        daysRemaining = Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      resultProfile = {
        ...data,
        plan,
        tier,
        status,
        subscriptionStartDate,
        subscriptionEndDate,
        resetDate,
        daysRemaining,
        filesChecked,
        monthlyAllowance,
        email: user.email || data.email,
        displayName: user.displayName || data.displayName
      };

      // Only update login timestamp — NEVER overwrite subscription dates or plan set in Firebase
      await setDoc(userDocRef, {
        lastLoginAt: nowIso,
        updatedAt: nowIso,
        email: user.email || data.email,
        displayName: user.displayName || data.displayName || null
      }, { merge: true }).catch(console.warn);

    } else {
      const localUsage = getUsageState(user.email || undefined);
      const activePlan = localUsage.plan !== 'free' ? localUsage.plan : 'free';
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const subscriptionEndDate = new Date(Date.now() + thirtyDaysMs).toISOString();

      resultProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        plan: activePlan,
        tier: activePlan.toUpperCase() as any,
        status: 'active',
        subscriptionStartDate: nowIso,
        subscriptionEndDate,
        resetDate: subscriptionEndDate,
        daysRemaining: 30,
        filesChecked: 0,
        monthlyAllowance: activePlan === 'studio' ? 999999 : activePlan === 'pro' ? 100 : 5,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        updatedAt: nowIso
      };

      await setDoc(userDocRef, resultProfile, { merge: true }).catch(console.warn);
    }

    // Sync active plan to local storage
    if (resultProfile.plan) {
      updatePlan(resultProfile.plan, user.email || undefined);
    }
    if (onUserDataChanged) {
      onUserDataChanged(resultProfile);
    }

    // Attach real-time Firestore snapshot listener so manual Firebase console edits reflect instantly
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const liveData = docSnap.data() as Partial<FirestoreUserProfile>;
        if (liveData) {
          const rawLivePlan = liveData.plan || 'free';
          const isLiveExpired = liveData.subscriptionEndDate 
            ? new Date(liveData.subscriptionEndDate).getTime() <= Date.now() 
            : false;

          const livePlan = isLiveExpired ? 'free' : rawLivePlan;
          const liveTier = (livePlan.toUpperCase() as any);
          const liveStatus = isLiveExpired ? 'expired' : (liveData.status || 'active');
          const liveMonthlyAllowance = isLiveExpired ? 5 : (livePlan === 'studio' ? 999999 : livePlan === 'pro' ? 100 : 5);

          let liveDaysRemaining = 0;
          if (liveData.subscriptionEndDate && !isLiveExpired) {
            const endMs = new Date(liveData.subscriptionEndDate).getTime();
            liveDaysRemaining = Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)));
          }

          const updated: Partial<FirestoreUserProfile> = {
            ...liveData,
            plan: livePlan,
            tier: liveTier,
            status: liveStatus,
            daysRemaining: liveDaysRemaining,
            monthlyAllowance: liveMonthlyAllowance
          };

          updatePlan(livePlan, user.email || undefined);
          if (onUserDataChanged) {
            onUserDataChanged(updated);
          }
        }
      }
    }, (err) => {
      console.warn('Firestore real-time subscription listener notice:', err);
    });

    return { profile: resultProfile, unsubscribe };

  } catch (err) {
    console.warn('Firestore sync notice:', err);
    const localUsage = getUsageState(user.email || undefined);
    const fallbackProfile: Partial<FirestoreUserProfile> = {
      plan: localUsage.plan,
      tier: localUsage.plan.toUpperCase() as any,
      status: 'active'
    };
    if (onUserDataChanged) onUserDataChanged(fallbackProfile);
    return { profile: fallbackProfile };
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
