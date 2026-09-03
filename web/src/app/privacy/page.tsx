import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft, Trash2, CheckCircle2, Cpu } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Sonichecks',
  description: 'Sonichecks Privacy Policy and zero-audio-upload local browser processing guarantee.'
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Data Protection &amp; Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last updated: September 2026 &bull; Zero-Audio-Upload Guarantee
          </p>
        </div>

        {/* Highlight Box: Zero Audio Upload Guarantee */}
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>Our Local Browser Processing &amp; Audio Privacy Guarantee</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Sonichecks processes all audio 100% locally on your device. Zero audio files or recordings are ever uploaded to any server or cloud database.</strong> All audio decoding and digital signal processing (ITU-R BS.1770-4 LUFS, True Peak dBTP, clipping detection) execute entirely within your browser&apos;s Web Audio runtime memory and are discarded immediately when analysis completes.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* 1. Information Collected */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            <p>We collect only the minimal account details necessary to manage your subscription tier and provide customer support:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Account Credentials:</strong> When you sign up or log in, your email address, display name, and active plan tier (Free, Pro, or Studio) are stored securely in Google Cloud Firebase Firestore.</li>
              <li><strong>Support Inquiries:</strong> Inquiries submitted through our Contact form are stored securely in our support database to communicate with you and resolve technical questions.</li>
              <li><strong>Payment Information:</strong> Subscriptions are processed directly and securely by our Merchant of Record payment gateway (Creem). Sonichecks never sees, handles, or stores your raw payment cards or banking credentials.</li>
            </ul>
          </section>

          {/* 2. Audio Processing Architecture */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. In-Browser Audio Processing (Zero Cloud Upload)</h2>
            <p>
              When you stage and analyze audio files (WAV, MP3, FLAC, AAC, M4A, OGG, AIFF) on Sonichecks:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Audio decoding and DSP computations run strictly client-side inside your browser via the Web Audio API and Web Workers.</li>
              <li>No audio bytes, waveforms, samples, or recordings are ever transmitted over the network or saved to remote disks.</li>
              <li>We never use, train, or expose your audio to any artificial intelligence or machine learning models.</li>
            </ul>
          </section>

          {/* 3. Browser Storage */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Local Device Storage &amp; Inspection History</h2>
            <p>
              Sonichecks uses your browser&apos;s <code className="text-cyan-300">localStorage</code> to retain your past inspection reports, numerical metrics, and cryptographic SHA-256 signatures locally on your device for instant offline retrieval and PDF/CSV re-exports.
            </p>
            <p>
              Clearing your browser cache or switching devices will reset your local inspection history. You can download permanent PDF Certificates or CSV spreadsheets at any time from your dashboard.
            </p>
          </section>

          {/* 4. Third-Party Infrastructure */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Trusted Infrastructure &amp; Security</h2>
            <p>
              We partner with industry-standard, secure infrastructure providers:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Google Firebase / Google Cloud:</strong> Encrypted user authentication and database management.</li>
              <li><strong>Creem Payments:</strong> PCI-DSS Level 1 compliant payment processing and subscription billing.</li>
            </ul>
          </section>

          {/* 5. User Rights */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Your Data Rights (GDPR &amp; CCPA Compliance)</h2>
            <p>
              You have the right to access, export, or permanently delete your account data at any time. To request complete account erasure from our authentication and database systems, simply contact our support team.
            </p>
          </section>

          {/* 6. Contact */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">6. Privacy Inquiries</h2>
            <p>
              If you have any questions regarding our privacy practices or data handling, please contact us at <span className="font-mono text-cyan-400">support@sonichecks.com</span> or via our <Link href="/contact" className="text-cyan-400 hover:underline">Contact Form</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
