import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, topic, message } = body;

    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanTopic = topic || 'Support & Technical Questions';
    const cleanMessage = message.trim();
    const nowIso = new Date().toISOString();

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database service is currently unavailable.' },
        { status: 500 }
      );
    }

    // Save contact message as a separate document in 'contact_messages' collection
    const docRef = await adminDb.collection('contact_messages').add({
      name: cleanName,
      email: cleanEmail,
      topic: cleanTopic,
      message: cleanMessage,
      createdAt: nowIso,
      status: 'unread',
      userAgent: req.headers.get('user-agent') || 'Unknown'
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Your inquiry has been submitted successfully.'
    });
  } catch (err: any) {
    console.error('Contact submission error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit message.' },
      { status: 500 }
    );
  }
}
