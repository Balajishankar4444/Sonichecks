const { initializeApp, cert, getApps } = require('../web/node_modules/firebase-admin/app');
const { getFirestore } = require('../web/node_modules/firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx !== -1) {
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const projectId = env.FIREBASE_PROJECT_ID || 'sonichecks-f7e58';
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
let privateKey = env.FIREBASE_PRIVATE_KEY;
if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

const db = getFirestore();

async function main() {
  try {
    const email = 'balajishankar4444@gmail.com';
    const userRef = db.collection('users').doc(email);
    const nowIso = new Date().toISOString();

    const userData = {
      email,
      displayName: 'Balaji',
      tier: 'PRO',
      plan: 'pro',
      status: 'active',
      monthlyAllowance: 100,
      registeredAt: '2026-09-03T16:04:12.208Z',
      lastLoginAt: nowIso,
      updatedAt: nowIso,
      creemCustomerId: 'cust_6WrfMnHRZu14fraCyHcIwQ'
    };

    console.log('Writing user document to Firestore collection "users" with ID:', email);
    await userRef.set(userData); // Overwrites without stacking
    console.log('✅ Successfully updated Firestore document!');

    console.log('Reading user document back from Firestore...');
    const snap = await userRef.get();
    console.log('Firestore data:', snap.data());
  } catch (err) {
    console.error('Firestore Admin error:', err);
  }
}

main();
