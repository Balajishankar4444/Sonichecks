import { 
  getOrSyncUserSubscription, 
  recordBackendUploadEvent, 
  cancelUserSubscription,
  getPlanAllowance, 
  UserSubscriptionRecord 
} from '../subscription-engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

class MockFirestoreCollection {
  private docs: Map<string, any> = new Map();

  doc(id: string) {
    const self = this;
    return {
      async get() {
        const data = self.docs.get(id);
        return {
          exists: !!data,
          data: () => (data ? { ...data } : undefined)
        };
      },
      async set(newData: any, options?: { merge?: boolean }) {
        if (options?.merge && self.docs.has(id)) {
          const current = self.docs.get(id);
          self.docs.set(id, { ...current, ...newData });
        } else {
          self.docs.set(id, { ...newData });
        }
      }
    };
  }

  _getRaw(id: string) {
    return this.docs.get(id);
  }

  _setRaw(id: string, data: any) {
    this.docs.set(id, data);
  }
}

class MockFirestore {
  private collections: Map<string, MockFirestoreCollection> = new Map();

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockFirestoreCollection());
    }
    return this.collections.get(name)!;
  }
}

export async function runSubscriptionTimelineTests() {
  console.log('🧪 Running Backend Subscription & Usage Timeline Engine Test Suite...\n');

  const mockDb = new MockFirestore() as any;

  // 1. Test Free User Creation & Initial Timeline
  {
    const email = 'new_audio_user@example.com';
    const user = await getOrSyncUserSubscription(email, {
      displayName: 'Test User',
      overrideAdminDb: mockDb
    });

    assert(user.plan === 'free', 'New user must start on Free plan');
    assert(user.monthlyAllowance === 5, 'Free user allowance must be 5');
    assert(user.filesChecked === 0, 'New user filesChecked must be 0');
    assert(user.daysRemaining > 0 && user.daysRemaining <= 30, 'Days remaining must be <= 30');
    assert(!!user.subscriptionStartDate, 'Must have subscriptionStartDate');
    assert(!!user.subscriptionEndDate, 'Must have subscriptionEndDate');
    assert(!!user.resetDate, 'Must have resetDate');

    const start = new Date(user.subscriptionStartDate).getTime();
    const end = new Date(user.subscriptionEndDate).getTime();
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    assert(diffDays >= 29 && diffDays <= 31, 'Subscription timeline duration must be 30 days');
    console.log('  ✅ Test 1: New Free user 30-day timeline & quota initialization passed');
  }

  // 2. Test Upload Event & Quota Decrementing
  {
    const email = 'uploader@example.com';
    await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });

    // Upload 3 files
    const res1 = await recordBackendUploadEvent(email, 3, { overrideAdminDb: mockDb });
    assert(res1.success, 'First upload batch should succeed');
    assert(res1.record.filesChecked === 3, 'filesChecked should be 3');
    assert(!!res1.record.lastUploadAt, 'lastUploadAt must be populated');

    // Upload 2 files (now 5/5)
    const res2 = await recordBackendUploadEvent(email, 2, { overrideAdminDb: mockDb });
    assert(res2.success, 'Second batch should reach 5/5 max');
    assert(res2.record.filesChecked === 5, 'filesChecked should be 5');

    // Attempt to exceed quota (1 more file on Free)
    const res3 = await recordBackendUploadEvent(email, 1, { overrideAdminDb: mockDb });
    assert(!res3.success, 'Exceeding quota should fail with error');
    assert(!!res3.error && res3.error.includes('quota exceeded'), 'Error should state quota exceeded');
    console.log('  ✅ Test 2: Upload event tracking and hard quota enforcement passed');
  }

  // 3. Test Upgrade to Pro Plan Timeline
  {
    const email = 'pro_subscriber@example.com';
    const upgraded = await getOrSyncUserSubscription(email, {
      forcePlan: 'pro',
      overrideAdminDb: mockDb
    });

    assert(upgraded.plan === 'pro', 'Plan must be Pro');
    assert(upgraded.tier === 'PRO', 'Tier must be PRO');
    assert(upgraded.monthlyAllowance === 100, 'Pro allowance must be 100 files');
    assert(upgraded.filesChecked === 0, 'Quota must reset to 0 on plan upgrade');
    assert(upgraded.daysRemaining >= 29 && upgraded.daysRemaining <= 30, 'Pro plan starts with 30 days remaining');
    console.log('  ✅ Test 3: Upgrade to Pro (€4.99) with 100-file allowance and 30-day timeline passed');
  }

  // 4. Test Upgrade to Studio Plan Timeline & Unlimited Quota
  {
    const email = 'studio_subscriber@example.com';
    const studio = await getOrSyncUserSubscription(email, {
      forcePlan: 'studio',
      overrideAdminDb: mockDb
    });

    assert(studio.plan === 'studio', 'Plan must be Studio');
    assert(studio.tier === 'STUDIO', 'Tier must be STUDIO');
    assert(studio.monthlyAllowance === -1, 'Studio allowance must be -1 (Unlimited)');
    assert(studio.daysRemaining >= 29 && studio.daysRemaining <= 30, 'Studio plan starts with 30 days remaining');

    // Studio user can check large batches without quota restrictions
    const largeBatch = await recordBackendUploadEvent(email, 1500, { overrideAdminDb: mockDb });
    assert(largeBatch.success === true, 'Studio user must be allowed to check unlimited files');
    assert(largeBatch.record.filesChecked === 1500, 'Studio user usage tracks 1500 files');
    console.log('  ✅ Test 4: Upgrade to Studio (€14.99) with Unlimited file allowance passed');
  }

  // 5. Test Automatic Downgrade on Expiration (Antigravity timeline rule)
  {
    const email = 'expired_user@example.com';
    // Simulate a past subscription that ended 2 days ago
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyTwoDaysAgo = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString();

    const usersCol = mockDb.collection('users');
    await usersCol.doc(email).set({
      email,
      plan: 'pro',
      tier: 'PRO',
      status: 'active',
      subscriptionStartDate: thirtyTwoDaysAgo,
      subscriptionEndDate: twoDaysAgo,
      resetDate: twoDaysAgo,
      filesChecked: 85,
      monthlyAllowance: 100,
      registeredAt: thirtyTwoDaysAgo
    });

    // Evaluate subscription timeline now
    const evaluated = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });

    assert(evaluated.plan === 'free', 'Expired paid subscription must automatically downgrade to free');
    assert(evaluated.tier === 'FREE', 'Tier must be FREE');
    assert(evaluated.status === 'expired', 'Status must be expired');
    assert(evaluated.monthlyAllowance === 5, 'Allowance must be reset to 5 files');
    assert(evaluated.filesChecked === 0, 'New free period filesChecked must be 0');
    assert(evaluated.daysRemaining === 0, 'Expired subscription must have 0 days remaining');
    console.log('  ✅ Test 5: Automatic downgrade from expired paid plan to Free plan passed');
  }

  // 6. Test Quota Rollover on Reset Date
  {
    const email = 'rollover_user@example.com';
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
    const futureEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

    const usersCol = mockDb.collection('users');
    await usersCol.doc(email).set({
      email,
      plan: 'pro',
      tier: 'PRO',
      status: 'active',
      subscriptionStartDate: twentyNineDaysAgo,
      subscriptionEndDate: futureEnd,
      resetDate: yesterday, // Reset date passed yesterday
      filesChecked: 95,
      monthlyAllowance: 100
    });

    const rolledOver = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(rolledOver.plan === 'pro', 'Plan remains Pro');
    assert(rolledOver.filesChecked === 0, 'filesChecked must reset to 0 after resetDate passes');
    assert(new Date(rolledOver.resetDate).getTime() > Date.now(), 'New resetDate must be in the future');
    console.log('  ✅ Test 6: Automatic quota rollover and resetDate advancement passed');
  }

  // 7. Test Subscription Cancellation & Access Retention
  {
    const email = 'cancel_test_user@example.com';
    // Activate Pro
    await getOrSyncUserSubscription(email, {
      forcePlan: 'pro',
      overrideAdminDb: mockDb
    });

    // Cancel subscription
    const cancelRes = await cancelUserSubscription(email, { overrideAdminDb: mockDb });
    assert(cancelRes.success === true, 'Cancellation must succeed');
    assert(cancelRes.record.status === 'cancelled', 'Status must be cancelled');
    assert(cancelRes.record.plan === 'pro', 'Plan remains Pro until period end');

    // Perform check during cancelled period (retains paid access)
    const checkRes = await recordBackendUploadEvent(email, 10, { overrideAdminDb: mockDb });
    assert(checkRes.success === true, 'User retains paid access during remaining period');

    // Subsequent page reload / sync must keep cancelled status
    const reloaded = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(reloaded.status === 'cancelled', 'Status must stay cancelled on reload');
    assert(reloaded.plan === 'pro', 'Plan remains Pro on reload until end date');

    console.log('  ✅ Test 7: Subscription cancellation & active access retention until cycle end passed');
  }

  // 8. Test Active Pro Subscriber Mid-Cycle Upgrade to Studio
  {
    const email = 'active_pro_to_studio@example.com';
    // 1. User is active Pro
    await getOrSyncUserSubscription(email, {
      forcePlan: 'pro',
      overrideAdminDb: mockDb
    });
    // Check some files on Pro
    await recordBackendUploadEvent(email, 25, { overrideAdminDb: mockDb });

    // 2. User purchases Studio upgrade
    const studioUpgrade = await getOrSyncUserSubscription(email, {
      forcePlan: 'studio',
      overrideAdminDb: mockDb
    });

    assert(studioUpgrade.plan === 'studio', 'Plan must immediately upgrade to studio');
    assert(studioUpgrade.tier === 'STUDIO', 'Tier must be STUDIO');
    assert(studioUpgrade.monthlyAllowance === -1, 'Studio allowance must be -1 unlimited');
    assert(studioUpgrade.filesChecked === 0, 'Quota must reset on upgrade');
    assert(studioUpgrade.status === 'active', 'Status must be active');

    // 3. User subsequent getOrSync returns studio
    const synced = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(synced.plan === 'studio', 'Subsequent sync must maintain Studio plan');
    assert(synced.monthlyAllowance === -1, 'Subsequent sync must maintain unlimited quota');
    console.log('  ✅ Test 8: Active Pro subscriber immediate mid-cycle upgrade to Studio passed');
  }

  // 9. Test Studio Subscription Renewal & Continuation (Never downgrades to Pro or Free while continuing)
  {
    const email = 'studio_continuing_user@example.com';
    // User is on active Studio
    await getOrSyncUserSubscription(email, {
      forcePlan: 'studio',
      overrideAdminDb: mockDb
    });

    // Simulate multi-month syncs
    const sync1 = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(sync1.plan === 'studio', 'Studio subscriber must stay on Studio plan');
    assert(sync1.tier === 'STUDIO', 'Tier must remain STUDIO');
    assert(sync1.monthlyAllowance === -1, 'Studio quota remains unlimited');

    const sync2 = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(sync2.plan === 'studio', 'Subsequent billing checks must never downgrade Studio to Pro');
    console.log('  ✅ Test 9: Continuous Studio plan retention across billing cycles passed');
  }

  // 10. Test Cancelled Paid Subscription Transition to Free After End Date
  {
    const email = 'cancelled_and_expired_user@example.com';
    const thirtyTwoDaysAgo = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const usersCol = mockDb.collection('users');
    await usersCol.doc(email).set({
      email,
      plan: 'studio',
      tier: 'STUDIO',
      status: 'cancelled',
      subscriptionStartDate: thirtyTwoDaysAgo,
      subscriptionEndDate: twoDaysAgo,
      resetDate: twoDaysAgo,
      filesChecked: 50,
      monthlyAllowance: -1,
      registeredAt: thirtyTwoDaysAgo
    });

    const evaluated = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(evaluated.plan === 'free', 'Cancelled subscription after end date must transition to Free');
    assert(evaluated.tier === 'FREE', 'Tier must transition to FREE');
    assert(evaluated.status === 'expired', 'Status must be expired');
    assert(evaluated.monthlyAllowance === 5, 'Allowance resets to 5 files');
    console.log('  ✅ Test 10: Cancelled subscription cleanly transitions to Free after 30-day period ends passed');
  }

  // 11. Test Custom Manual Firestore Date Preservation
  {
    const email = 'manual_firestore_tester@example.com';
    const customFutureEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();

    const usersCol = mockDb.collection('users');
    await usersCol.doc(email).set({
      email,
      plan: 'studio',
      tier: 'STUDIO',
      status: 'active',
      subscriptionStartDate: startDate,
      subscriptionEndDate: customFutureEnd,
      resetDate: customFutureEnd,
      filesChecked: 12,
      monthlyAllowance: -1,
      registeredAt: startDate
    });

    const evaluated = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(evaluated.plan === 'studio', 'Plan must remain studio');
    assert(evaluated.subscriptionEndDate === customFutureEnd, 'Must preserve custom manual subscriptionEndDate from Firestore');
    assert(evaluated.daysRemaining === 15, `daysRemaining should be 15, got ${evaluated.daysRemaining}`);
    console.log('  ✅ Test 11: Manual Firestore subscriptionEndDate & plan preservation passed');
  }

  // 12. Test Client Data Fallback (when Admin DB is not initialized)
  {
    const email = 'client_fallback_tester@example.com';
    const customFutureEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const startDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

    const evaluated = await getOrSyncUserSubscription(email, {
      overrideAdminDb: null, // Simulate no server-side Firestore
      clientData: {
        email,
        plan: 'pro',
        tier: 'PRO',
        status: 'active',
        subscriptionStartDate: startDate,
        subscriptionEndDate: customFutureEnd,
        resetDate: customFutureEnd,
        filesChecked: 5,
        monthlyAllowance: 100
      }
    });

    assert(evaluated.plan === 'pro', 'Must honor client Firestore plan');
    assert(evaluated.subscriptionEndDate === customFutureEnd, 'Must honor client Firestore subscriptionEndDate');
    assert(evaluated.daysRemaining === 10, `daysRemaining should be 10, got ${evaluated.daysRemaining}`);
    console.log('  ✅ Test 12: Client Firestore fallback synchronization passed');
  }

  // 13. Test Creem Customer Manual Expiration Testing in Firestore
  {
    const email = 'creem_customer_expiration_tester@example.com';
    const pastEndDate = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 mins in the past
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const usersCol = mockDb.collection('users');
    await usersCol.doc(email).set({
      email,
      plan: 'studio',
      tier: 'STUDIO',
      status: 'active',
      creemCustomerId: 'cust_6WrfMnHRZu14fraCyHcIwQ',
      creemSubscriptionId: null,
      subscriptionStartDate: startDate,
      subscriptionEndDate: pastEndDate,
      resetDate: pastEndDate,
      filesChecked: 15,
      monthlyAllowance: -1,
      registeredAt: startDate
    });

    const evaluated = await getOrSyncUserSubscription(email, { overrideAdminDb: mockDb });
    assert(evaluated.plan === 'free', `Expected plan 'free' on expired test date, got '${evaluated.plan}'`);
    assert(evaluated.tier === 'FREE', `Expected tier 'FREE', got '${evaluated.tier}'`);
    assert(evaluated.status === 'expired', `Expected status 'expired', got '${evaluated.status}'`);
    assert(evaluated.daysRemaining === 0, `Expected daysRemaining 0, got ${evaluated.daysRemaining}`);
    assert(evaluated.monthlyAllowance === 5, `Expected monthlyAllowance 5, got ${evaluated.monthlyAllowance}`);
    console.log('  ✅ Test 13: Creem customer manual expiration testing passed');
  }

  console.log('\n🎉 ALL 13 BACKEND SUBSCRIPTION & USAGE TIMELINE TESTS PASSED!\n');
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('subscription-engine.test')) {
  runSubscriptionTimelineTests().catch((err) => {
    console.error('❌ Test failure:', err);
    process.exit(1);
  });
}
