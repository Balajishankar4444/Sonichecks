import { NextRequest, NextResponse } from 'next/server';
import { cancelUserSubscription } from '@/lib/server/subscription-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const result = await cancelUserSubscription(email);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      record: result.record
    });
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
