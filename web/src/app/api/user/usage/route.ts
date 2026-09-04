import { NextRequest, NextResponse } from 'next/server';
import { getOrSyncUserSubscription, recordBackendUploadEvent } from '@/lib/server/subscription-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const clientFilesChecked = searchParams.get('clientFilesChecked');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const record = await getOrSyncUserSubscription(email, {
      clientFilesChecked: clientFilesChecked ? Number(clientFilesChecked) : undefined
    });

    return NextResponse.json({
      success: true,
      ...record
    });

  } catch (error: any) {
    console.error('Usage API GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve usage' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fileCount = 1 } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await recordBackendUploadEvent(email, Number(fileCount) || 1);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error, 
          record: result.record 
        }, 
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result.record
    });

  } catch (error: any) {
    console.error('Usage API POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record usage' },
      { status: 500 }
    );
  }
}
