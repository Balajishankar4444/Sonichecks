import { NextRequest, NextResponse } from 'next/server';
import { getOrSyncUserSubscription, checkCreemSubscription } from '@/lib/server/subscription-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const planParam = searchParams.get('plan')?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const forcePlan = (planParam === 'pro' || planParam === 'studio') ? planParam : undefined;

    const record = await getOrSyncUserSubscription(email, {
      forcePlan
    });

    return NextResponse.json({
      success: true,
      ...record
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

    const validPlan = plan === 'studio' ? 'studio' : 'pro';

    const record = await getOrSyncUserSubscription(email, {
      forcePlan: validPlan
    });

    return NextResponse.json({
      success: true,
      ...record
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
