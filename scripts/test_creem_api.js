const apiKey = process.env.CREEM_API_KEY || 'creem_test_3p3jA5JhzxAB8AEd3E8rP7';
const isTest = apiKey.startsWith('creem_test_');
const apiBase = isTest ? 'https://test-api.creem.io' : 'https://api.creem.io';

async function testCreem() {
  try {
    const custId = 'cust_6WrfMnHRZu14fraCyHcIwQ';
    const res = await fetch(`${apiBase}/v1/subscriptions?customer_id=${encodeURIComponent(custId)}`, {
      headers: { 'x-api-key': apiKey }
    });
    console.log('Subscriptions query status:', res.status);
    const data = await res.json();
    console.log('Subscriptions data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Creem error:', e);
  }
}
testCreem();
