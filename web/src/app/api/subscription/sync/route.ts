import { NextRequest, NextResponse } from 'next/server';

const CREEM_API_KEY = process.env.CREEM_API_KEY || 'creem_test_3p3jA5JhzxAB8AEd3E8rP7';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const planParam = searchParams.get('plan')?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const isTest = CREEM_API_KEY.startsWith('creem_test_');
    const apiBase = isTest ? 'https://test-api.creem.io' : 'https://api.creem.io';

    let creemCustomer = null;
    let resolvedPlan: 'pro' | 'studio' | 'free' = 'free';

    // 1. Query Creem API for customer with this email
    try {
      const creemRes = await fetch(`${apiBase}/v1/customers?email=${encodeURIComponent(email)}`, {
        headers: { 'x-api-key': CREEM_API_KEY }
      });

      if (creemRes.ok) {
        creemCustomer = await creemRes.json();
        // If customer exists on Creem, they have an active paid account
        if (creemCustomer && creemCustomer.id) {
          resolvedPlan = (planParam === 'studio' ? 'studio' : 'pro');
        }
      }
    } catch (apiErr) {
      console.warn('Creem customer lookup notice:', apiErr);
    }

    // 2. If planParam was explicitly passed
    if (planParam === 'pro' || planParam === 'studio') {
      resolvedPlan = planParam;
    }

    return NextResponse.json({
      success: true,
      email,
      plan: resolvedPlan,
      isPaid: resolvedPlan !== 'free',
      customer: creemCustomer,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Subscription sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, plan = 'pro' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      email,
      plan: plan === 'studio' ? 'studio' : 'pro',
      status: 'active'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
