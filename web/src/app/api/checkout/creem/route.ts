import { NextRequest, NextResponse } from 'next/server';

const CREEM_API_KEY = process.env.CREEM_API_KEY || 'creem_test_3p3jA5JhzxAB8AEd3E8rP7';

// Real product IDs from the Creem store
const CREEM_PRODUCT_IDS: Record<string, string> = {
  pro: 'prod_403pcqlci8ftt5NDEoMgUm',      // Pro Plan (€4.99/mo)
  studio: 'prod_5ET7sC2HVVNfakcDtgMPaL'   // Studio Plan (€14.99/mo)
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan = 'pro', customerEmail } = body;

    const planKey = plan.toLowerCase();
    const productId = CREEM_PRODUCT_IDS[planKey] || CREEM_PRODUCT_IDS.pro;

    const isTest = CREEM_API_KEY.startsWith('creem_test_');
    const apiBase = isTest ? 'https://test-api.creem.io' : 'https://api.creem.io';

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/dashboard?payment=success&plan=${planKey}`;

    const payload: Record<string, any> = {
      product_id: productId,
      success_url: successUrl
    };

    if (customerEmail) {
      payload.customer = { email: customerEmail };
    }

    const response = await fetch(`${apiBase}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Creem API Error:', response.status, errText);
      return NextResponse.json(
        { error: `Creem API error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const checkoutUrl = data.checkout_url || data.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'No checkout URL returned from Creem' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl,
      sessionId: data.id
    });

  } catch (error: any) {
    console.error('Checkout handler exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate checkout' },
      { status: 500 }
    );
  }
}
