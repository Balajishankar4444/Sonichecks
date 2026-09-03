import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

const CREEM_API_KEY = process.env.CREEM_API_KEY || 'creem_test_3p3jA5JhzxAB8AEd3E8rP7';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, forcePlan } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const nowIso = new Date().toISOString();
    const adminDb = getAdminFirestore();

    let userPlan: 'pro' | 'studio' | 'free' = 'free';
    let userTier: 'PRO' | 'STUDIO' | 'FREE' = 'FREE';
    let registeredAt = nowIso;
    let creemCustId = null;

    // 1. Check Creem API to see if this customer paid
    try {
      const isTest = CREEM_API_KEY.startsWith('creem_test_');
      const apiBase = isTest ? 'https://test-api.creem.io' : 'https://api.creem.io';
      const creemRes = await fetch(`${apiBase}/v1/customers?email=${encodeURIComponent(cleanEmail)}`, {
        headers: { 'x-api-key': CREEM_API_KEY }
      });

      if (creemRes.ok) {
        const custData = await creemRes.json();
        if (custData && custData.id) {
          creemCustId = custData.id;
          userPlan = 'pro';
          userTier = 'PRO';
          if (custData.created_at) {
            registeredAt = custData.created_at;
          }
        }
      }
    } catch (creemErr) {
      console.warn('Creem lookup notice:', creemErr);
    }

    if (forcePlan === 'pro' || forcePlan === 'studio') {
      userPlan = forcePlan;
      userTier = forcePlan.toUpperCase() as any;
    }

    // 2. Fetch existing Firestore user document to preserve existing tier if already upgraded
    if (adminDb) {
      try {
        const userRef = adminDb.collection('users').doc(cleanEmail);
        const existingSnap = await userRef.get();

        if (existingSnap.exists) {
          const existingData = existingSnap.data() || {};
          if (existingData.registeredAt) registeredAt = existingData.registeredAt;
          if (existingData.plan === 'studio' || existingData.tier === 'STUDIO') {
            userPlan = 'studio';
            userTier = 'STUDIO';
          } else if (existingData.plan === 'pro' || existingData.tier === 'PRO') {
            userPlan = 'pro';
            userTier = 'PRO';
          }
        }

        const updatedDoc = {
          email: cleanEmail,
          displayName: displayName || cleanEmail.split('@')[0],
          tier: userTier,
          plan: userPlan,
          status: 'active',
          monthlyAllowance: userTier === 'STUDIO' ? 500 : userTier === 'PRO' ? 100 : 5,
          registeredAt,
          lastLoginAt: nowIso,
          updatedAt: nowIso,
          creemCustomerId: creemCustId || null
        };

        // Overwrites cleanly without stacking
        await userRef.set(updatedDoc);
      } catch (dbErr) {
        console.error('Firestore Admin write error:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      tier: userTier,
      plan: userPlan,
      monthlyAllowance: userTier === 'STUDIO' ? 500 : userTier === 'PRO' ? 100 : 5,
      registeredAt,
      lastLoginAt: nowIso
    });

  } catch (err: any) {
    console.error('User login API handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const userRef = adminDb.collection('users').doc(email);
    const snap = await userRef.get();

    if (!snap.exists) {
      return NextResponse.json({ found: false, plan: 'free', tier: 'FREE' });
    }

    return NextResponse.json({
      found: true,
      ...snap.data()
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
