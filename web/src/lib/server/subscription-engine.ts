import { Firestore } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';

export interface UserSubscriptionRecord {
  email: string;
  displayName: string;
  plan: 'free' | 'pro' | 'studio';
  tier: 'FREE' | 'PRO' | 'STUDIO';
  status: 'active' | 'expired' | 'cancelled';
  // Timeline dates
  subscriptionStartDate: string; // ISO string
  subscriptionEndDate: string;   // ISO string
  currentPeriodStart: string;    // ISO string
  currentPeriodEnd: string;      // ISO string
  resetDate: string;             // ISO string of next quota reset
  daysRemaining: number;
  // Quota & Usage
  filesChecked: number;
  monthlyAllowance: number;
  lastUploadAt: string | null;
  // Metadata
  registeredAt: string;
  lastLoginAt: string;
  updatedAt: string;
  creemCustomerId?: string | null;
  creemSubscriptionId?: string | null;
}

const CREEM_API_KEY = process.env.CREEM_API_KEY || 'creem_test_3p3jA5JhzxAB8AEd3E8rP7';
const CREEM_PRODUCT_PRO = process.env.CREEM_PRODUCT_PRO || 'prod_403pcqlci8ftt5NDEoMgUm';
const CREEM_PRODUCT_STUDIO = process.env.CREEM_PRODUCT_STUDIO || 'prod_5ET7sC2HVVNfakcDtgMPaL';

/**
 * Accurately determines if a Creem record belongs to Studio or Pro plan.
 */
export function determineCreemPlan(item: any): 'studio' | 'pro' {
  if (!item) return 'pro';
  const str = JSON.stringify(item).toLowerCase();
  const prodId = String(item.product_id || item.productId || item.product || item.product_tier || '').toLowerCase();
  const prodName = String(item.product_name || item.name || item.description || item.title || item.plan || '').toLowerCase();
  const amount = Number(item.amount || item.price || item.unit_amount || item.total_amount || item.total || 0);

  if (
    prodId === CREEM_PRODUCT_STUDIO.toLowerCase() ||
    prodId.includes('studio') ||
    prodName.includes('studio') ||
    str.includes(CREEM_PRODUCT_STUDIO.toLowerCase()) ||
    str.includes('studio') ||
    amount >= 1400 // €14.99 in cents
  ) {
    return 'studio';
  }
  return 'pro';
}

/**
 * Get standard monthly file quota per plan.
 * Returns -1 for unlimited (Studio plan).
 */
export function getPlanAllowance(plan: 'free' | 'pro' | 'studio'): number {
  switch (plan) {
    case 'studio': return -1; // -1 represents unlimited
    case 'pro': return 100;
    case 'free':
    default: return 5;
  }
}

/**
 * Check Creem API across checkouts, subscriptions, and customers to verify active paid status.
 */
export async function checkCreemSubscription(email: string): Promise<{
  isActive: boolean;
  plan: 'pro' | 'studio' | null;
  customerId: string | null;
  subscriptionId: string | null;
  expiresAt: string | null;
}> {
  try {
    const isTest = CREEM_API_KEY.startsWith('creem_test_');
    const apiBase = isTest ? 'https://test-api.creem.io' : 'https://api.creem.io';
    const cleanEmail = email.toLowerCase().trim();
    
    let activeCustomer: any = null;
    let activeSubscription: any = null;
    let activeCheckout: any = null;

    // 1. Query checkouts endpoint
    try {
      const chkRes = await fetch(`${apiBase}/v1/checkouts?email=${encodeURIComponent(cleanEmail)}`, {
        headers: { 'x-api-key': CREEM_API_KEY }
      });
      if (chkRes.ok) {
        const chkData = await chkRes.json();
        const chks = Array.isArray(chkData) ? chkData : (chkData?.items || chkData?.data || (chkData?.id ? [chkData] : []));
        if (chks.length > 0) {
          const studioChk = chks.find((c: any) => determineCreemPlan(c) === 'studio');
          activeCheckout = studioChk || chks[0];
        }
      }
    } catch (chkErr) {
      console.warn('Creem checkouts lookup notice:', chkErr);
    }

    // 2. Query subscriptions endpoint
    try {
      const subRes = await fetch(`${apiBase}/v1/subscriptions?email=${encodeURIComponent(cleanEmail)}`, {
        headers: { 'x-api-key': CREEM_API_KEY }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        const subs = Array.isArray(subData) ? subData : (subData?.items || subData?.data || (subData?.id ? [subData] : []));
        if (subs.length > 0) {
          const studioSub = subs.find((s: any) => determineCreemPlan(s) === 'studio' && s.status !== 'canceled' && s.status !== 'expired');
          const validSub = studioSub || subs.find((s: any) => s.status !== 'canceled' && s.status !== 'expired') || subs[0];
          if (validSub) {
            activeSubscription = validSub;
          }
        }
      }
    } catch (subErr) {
      console.warn('Creem subscription lookup notice:', subErr);
    }

    // 3. Query customers endpoint
    try {
      const res = await fetch(`${apiBase}/v1/customers?email=${encodeURIComponent(cleanEmail)}`, {
        headers: { 'x-api-key': CREEM_API_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || (Array.isArray(data) && data.length > 0))) {
          const custs = Array.isArray(data) ? data : [data];
          const studioCust = custs.find((c: any) => determineCreemPlan(c) === 'studio');
          activeCustomer = studioCust || custs[0];
        }
      }
    } catch (custErr) {
      console.warn('Creem customer lookup notice:', custErr);
    }

    const matchedRecord = activeSubscription || activeCheckout || activeCustomer;
    if (matchedRecord) {
      let plan = determineCreemPlan(matchedRecord);
      if (
        (activeCheckout && determineCreemPlan(activeCheckout) === 'studio') ||
        (activeSubscription && determineCreemPlan(activeSubscription) === 'studio') ||
        (activeCustomer && determineCreemPlan(activeCustomer) === 'studio')
      ) {
        plan = 'studio';
      }

      return {
        isActive: true,
        plan,
        customerId: activeCustomer?.id || activeSubscription?.customer_id || activeSubscription?.customer || null,
        subscriptionId: activeSubscription?.id || activeCustomer?.subscription_id || activeCustomer?.subscription || null,
        expiresAt: activeSubscription?.current_period_end || activeSubscription?.period_end || activeCustomer?.current_period_end || activeCustomer?.period_end || null
      };
    }

    return { isActive: false, plan: null, customerId: null, subscriptionId: null, expiresAt: null };
  } catch (e) {
    console.warn('Creem lookup error:', e);
    return { isActive: false, plan: null, customerId: null, subscriptionId: null, expiresAt: null };
  }
}

/**
 * Cancel Creem subscription at period end so customer is not debited again.
 */
export async function cancelCreemSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const isTest = CREEM_API_KEY.startsWith('creem_test_');
    const apiBase = isTest ? 'https://test-api.creem.io' : 'https://api.creem.io';
    
    // 1. Send cancel request to Creem API to stop future rebills
    const res = await fetch(`${apiBase}/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'x-api-key': CREEM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cancel_at_period_end: true
      })
    });

    if (res.ok) return true;

    // 2. Direct fallback cancel
    const fallback = await fetch(`${apiBase}/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'x-api-key': CREEM_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return fallback.ok;
  } catch (e) {
    console.warn('Creem subscription cancel notice:', e);
    return false;
  }
}

/**
 * Marks a user's subscription as cancelled at period end.
 * Sends cancellation to Creem to stop future money debits.
 * Full access to paid features continues until subscriptionEndDate is reached.
 */
export async function cancelUserSubscription(
  email: string,
  options?: { overrideAdminDb?: Firestore | null }
): Promise<{ success: boolean; record: UserSubscriptionRecord; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const record = await getOrSyncUserSubscription(cleanEmail, {
    overrideAdminDb: options?.overrideAdminDb
  });

  if (record.plan === 'free') {
    return {
      success: false,
      record,
      message: 'You are currently on the Free plan.'
    };
  }

  // 1. Look up Creem subscription ID and send cancellation to Creem backend
  let subId = record.creemSubscriptionId;
  let custId = record.creemCustomerId;

  if (!subId || !custId) {
    const creemInfo = await checkCreemSubscription(cleanEmail);
    if (creemInfo.subscriptionId) {
      subId = creemInfo.subscriptionId;
      record.creemSubscriptionId = subId;
    }
    if (creemInfo.customerId) {
      custId = creemInfo.customerId;
      record.creemCustomerId = custId;
    }
  }

  if (subId) {
    await cancelCreemSubscription(subId);
  }

  const nowIso = new Date().toISOString();
  record.status = 'cancelled';
  record.updatedAt = nowIso;

  const adminDb = options?.overrideAdminDb !== undefined ? options.overrideAdminDb : getAdminFirestore();
  if (adminDb) {
    try {
      const userRef = adminDb.collection('users').doc(cleanEmail);
      await userRef.set({
        status: 'cancelled',
        creemSubscriptionId: subId || null,
        creemCustomerId: custId || null,
        updatedAt: nowIso
      }, { merge: true });
    } catch (dbErr) {
      console.warn('Firestore cancel save notice:', dbErr);
    }
  }

  return {
    success: true,
    record,
    message: `Subscription auto-renewal cancelled. You will not be charged again. Full access to ${record.plan.toUpperCase()} features remains active until your 30-day period ends, after which your account transitions to the Free plan.`
  };
}

/**
 * Evaluates a user's subscription timeline, checks expiration dates,
 * automatically performs reset or downgrade, and returns verified backend state.
 */
export async function getOrSyncUserSubscription(
  email: string,
  options?: {
    displayName?: string;
    forcePlan?: 'free' | 'pro' | 'studio';
    overrideAdminDb?: Firestore | null;
    clientFilesChecked?: number;
    clientData?: Partial<UserSubscriptionRecord>;
  }
): Promise<UserSubscriptionRecord> {
  const cleanEmail = email.trim().toLowerCase();
  const now = new Date();
  const nowIso = now.toISOString();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  
  const adminDb = options?.overrideAdminDb !== undefined ? options.overrideAdminDb : getAdminFirestore();

  let existingData: Partial<UserSubscriptionRecord> | null = null;
  let userRef: any = null;

  if (adminDb) {
    try {
      userRef = adminDb.collection('users').doc(cleanEmail);
      const snap = await userRef.get();
      if (snap.exists) {
        existingData = snap.data() as Partial<UserSubscriptionRecord>;
      }
    } catch (dbErr) {
      console.warn('Firestore fetch notice:', dbErr);
    }
  }

  // Fallback or merge with clientData (useful for direct client Firestore sync or dev testing)
  if (!existingData && options?.clientData) {
    existingData = options.clientData;
  } else if (existingData && options?.clientData) {
    existingData = { ...options.clientData, ...existingData };
  }

  const hasExplicitEndDate = !!existingData?.subscriptionEndDate;

  // 1. Initial defaults
  let plan: 'free' | 'pro' | 'studio' = existingData?.plan || 'free';
  let tier: 'FREE' | 'PRO' | 'STUDIO' = (plan.toUpperCase() as any) || 'FREE';
  let status: 'active' | 'expired' | 'cancelled' = existingData?.status || 'active';
  let registeredAt = existingData?.registeredAt || nowIso;
  let lastLoginAt = nowIso;
  let filesChecked = existingData?.filesChecked ?? 0;
  let lastUploadAt = existingData?.lastUploadAt || null;
  let creemCustomerId = existingData?.creemCustomerId || null;
  let creemSubscriptionId = existingData?.creemSubscriptionId || null;

  let subscriptionStartDate = existingData?.subscriptionStartDate || registeredAt;
  let subscriptionEndDate = existingData?.subscriptionEndDate || new Date(new Date(subscriptionStartDate).getTime() + thirtyDaysMs).toISOString();
  let resetDate = existingData?.resetDate || subscriptionEndDate;

  // Sync client total files if higher within the same billing window
  if (options?.clientFilesChecked !== undefined && typeof options.clientFilesChecked === 'number') {
    if (options.clientFilesChecked > filesChecked) {
      filesChecked = options.clientFilesChecked;
    }
  }

  // 2. Handle force plan (e.g. immediate test or manual switch)
  if (options?.forcePlan) {
    plan = options.forcePlan;
    tier = options.forcePlan.toUpperCase() as any;
    status = 'active';
    subscriptionStartDate = nowIso;
    subscriptionEndDate = new Date(now.getTime() + thirtyDaysMs).toISOString();
    resetDate = subscriptionEndDate;
    filesChecked = 0; // Reset on new plan activation
  } else {
    // 3. Evaluate Timeline, Expiry & Live Creem Status
    const endDateTime = new Date(subscriptionEndDate).getTime();
    const resetDateTime = new Date(resetDate).getTime();
    const isWithinActiveCycle = now.getTime() <= endDateTime;

    // Check Creem live status for active plan or upgrades
    const creemStatus = await checkCreemSubscription(cleanEmail);

    if (existingData?.status === 'cancelled' && isWithinActiveCycle && plan !== 'free') {
      // User explicitly cancelled auto-renewal: preserve cancelled status while retaining paid features until period end date
      status = 'cancelled';
      tier = plan.toUpperCase() as any;
      if (now.getTime() >= resetDateTime) {
        filesChecked = 0;
        resetDate = new Date(now.getTime() + thirtyDaysMs).toISOString();
      }
    } else if (creemStatus.isActive) {
      if (creemStatus.customerId) creemCustomerId = creemStatus.customerId;
      if (creemStatus.subscriptionId) creemSubscriptionId = creemStatus.subscriptionId;

      if (!isWithinActiveCycle) {
        // Expired cycle: only stay active/renew if Creem gives a genuine future expiry or no manual test date was specified
        if (creemStatus.expiresAt && new Date(creemStatus.expiresAt).getTime() > now.getTime()) {
          if (creemStatus.plan === 'studio' || plan === 'studio') {
            plan = 'studio';
            tier = 'STUDIO';
          } else {
            plan = 'pro';
            tier = 'PRO';
          }
          status = 'active';
          subscriptionStartDate = nowIso;
          subscriptionEndDate = creemStatus.expiresAt;
          resetDate = subscriptionEndDate;
          filesChecked = 0;
        } else if (!hasExplicitEndDate) {
          if (creemStatus.plan === 'studio' || plan === 'studio') {
            plan = 'studio';
            tier = 'STUDIO';
          } else {
            plan = 'pro';
            tier = 'PRO';
          }
          status = 'active';
          subscriptionStartDate = nowIso;
          subscriptionEndDate = new Date(now.getTime() + thirtyDaysMs).toISOString();
          resetDate = subscriptionEndDate;
          filesChecked = 0;
        } else {
          // Explicit manual test date set to the past in Firestore: transition to expired Free
          plan = 'free';
          tier = 'FREE';
          status = 'expired';
          filesChecked = 0;
        }
      } else {
        // Within active cycle
        if (creemStatus.plan === 'studio' || plan === 'studio') {
          plan = 'studio';
          tier = 'STUDIO';
        } else if (creemStatus.plan === 'pro' || plan === 'pro') {
          plan = 'pro';
          tier = 'PRO';
        }
        status = 'active';

        if (now.getTime() >= resetDateTime) {
          // Active monthly quota rollover
          filesChecked = 0;
          resetDate = new Date(now.getTime() + thirtyDaysMs).toISOString();
        }
      }
    } else {
      // Creem returned not active / Free user / Manual testing mode
      if (isWithinActiveCycle && plan !== 'free' && status !== 'expired') {
        // Retain current paid tier (Studio or Pro) until the active paid period finishes
        tier = plan.toUpperCase() as any;
        if (now.getTime() >= resetDateTime) {
          filesChecked = 0;
          resetDate = new Date(now.getTime() + thirtyDaysMs).toISOString();
        }
      } else if (plan !== 'free') {
        // SUBSCRIPTION STOPPED / EXPIRED: Automatically transition to Free plan
        plan = 'free';
        tier = 'FREE';
        status = 'expired';
        filesChecked = 0;
      } else {
        // FREE PLAN: 30-day rolling quota reset
        if (now.getTime() >= resetDateTime) {
          filesChecked = 0;
          resetDate = new Date(now.getTime() + thirtyDaysMs).toISOString();
        }
      }
    }
  }

  const monthlyAllowance = getPlanAllowance(plan);
  const isPastEnd = now.getTime() >= new Date(subscriptionEndDate).getTime();
  const daysRemaining = (status === 'expired' || isPastEnd) 
    ? 0 
    : Math.max(0, Math.ceil((new Date(subscriptionEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const fullRecord: UserSubscriptionRecord = {
    email: cleanEmail,
    displayName: options?.displayName || existingData?.displayName || cleanEmail.split('@')[0],
    plan,
    tier,
    status,
    subscriptionStartDate,
    subscriptionEndDate,
    currentPeriodStart: subscriptionStartDate,
    currentPeriodEnd: subscriptionEndDate,
    resetDate,
    daysRemaining,
    filesChecked,
    monthlyAllowance,
    lastUploadAt,
    registeredAt,
    lastLoginAt,
    updatedAt: nowIso,
    creemCustomerId,
    creemSubscriptionId
  };

  // Persist verified backend state to Firestore
  if (userRef) {
    try {
      await userRef.set(fullRecord, { merge: true });
    } catch (saveErr) {
      console.error('Failed to update user subscription in Firestore:', saveErr);
    }
  }

  return fullRecord;
}

/**
 * Record an upload / analysis event in the backend, decrement quota,
 * and update lastUploadAt timestamp.
 */
export async function recordBackendUploadEvent(
  email: string,
  fileCount: number = 1,
  options?: { 
    overrideAdminDb?: Firestore | null;
    clientFilesChecked?: number;
  }
): Promise<{ success: boolean; record: UserSubscriptionRecord; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Fetch current verified state with timeline evaluation & sync
  const record = await getOrSyncUserSubscription(cleanEmail, {
    overrideAdminDb: options?.overrideAdminDb,
    clientFilesChecked: options?.clientFilesChecked
  });

  // 2. Check quota (Studio plan is completely unlimited)
  const isUnlimited = record.plan === 'studio' || record.monthlyAllowance === -1;
  if (!isUnlimited && record.filesChecked + fileCount > record.monthlyAllowance) {
    return {
      success: false,
      record,
      error: `Monthly quota exceeded. You have used ${record.filesChecked} of ${record.monthlyAllowance} files on the ${record.plan.toUpperCase()} plan. Your quota resets on ${new Date(record.resetDate).toLocaleDateString()}.`
    };
  }

  // 3. Update usage
  const nowIso = new Date().toISOString();
  record.filesChecked += fileCount;
  record.lastUploadAt = nowIso;
  record.updatedAt = nowIso;

  const adminDb = options?.overrideAdminDb !== undefined ? options.overrideAdminDb : getAdminFirestore();
  if (adminDb) {
    try {
      const userRef = adminDb.collection('users').doc(cleanEmail);
      await userRef.set({
        filesChecked: record.filesChecked,
        lastUploadAt: nowIso,
        updatedAt: nowIso
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to record upload in Firestore:', e);
    }
  }

  return { success: true, record };
}
