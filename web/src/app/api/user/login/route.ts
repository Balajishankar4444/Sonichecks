import { NextRequest, NextResponse } from 'next/server';
import { getOrSyncUserSubscription } from '@/lib/server/subscription-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, forcePlan, clientFilesChecked, clientData } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const record = await getOrSyncUserSubscription(email, {
      displayName,
      forcePlan,
      clientFilesChecked: typeof clientFilesChecked === 'number' ? clientFilesChecked : undefined,
      clientData
    });

    return NextResponse.json({
      success: true,
      ...record
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

    const record = await getOrSyncUserSubscription(email);

    return NextResponse.json({
      success: true,
      ...record
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
