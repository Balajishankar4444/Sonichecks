import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Sonichecks',
  description: 'Sonichecks Privacy Policy and zero-retention ephemeral audio processing guarantee.'
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
            Last updated: September 2026
          </p>
        </div>

        {/* Highlight Box: Zero Retention Guarantee */}
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>Our Audio Privacy Guarantee</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Sonichecks never permanently stores, listens to, shares, or trains AI models on your uploaded audio.</strong> All audio files are held in isolated temporary runtime memory solely for the seconds required to compute mathematical QC measurements, and are immediately purged from our servers upon completion.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* 1. Information Collected */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            <p>We collect minimal information necessary to deliver quality control services:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Account Information:</strong> When you register, we store your email address and authentication credentials.</li>
              <li><strong>Quality Control Metadata:</strong> Mathematical metrics resulting from analysis (such as sample rates, calculated LUFS levels, peak dBTP, clipping sample counts) are stored to populate your dashboard history.</li>
              <li><strong>Transaction Data:</strong> If subscribing to a paid plan, payment processing is handled securely by our payment processor (e.g. Stripe). We do not store complete credit card details on our servers.</li>
            </ul>
          </section>

          {/* 2. Uploaded Audio Handling */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Uploaded Audio Processing &amp; Deletion</h2>
            <p>
              When you upload audio files (WAV, AIFF, FLAC, MP3) to Sonichecks:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Files are streamed directly into an isolated, temporary processing directory.</li>
              <li>Calculations (ITU-R BS.1770-4, True Peak oversampling, clipping detection) run in memory.</li>
              <li>Once the JSON results response is generated (or if an error or cancellation occurs), the temporary audio file is deleted immediately.</li>
            </ul>
          </section>

          {/* 3. Cookies & Analytics */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Cookies &amp; Local Storage</h2>
            <p>
              Sonichecks uses browser <code className="text-cyan-300">localStorage</code> to maintain your staging queue and recent check history locally on your device. We use strictly necessary cookies for session management. We do not sell user data to advertising networks.
            </p>
          </section>

          {/* 4. Third-Party Services */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Third-Party Service Providers</h2>
            <p>
              We partner with trusted infrastructure providers who uphold high data protection standards:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Hosting &amp; Compute:</strong> Modern cloud hosting with encrypted in-transit HTTPS data transmission.</li>
              <li><strong>Billing:</strong> Stripe for PCI-DSS compliant billing processing.</li>
            </ul>
          </section>

          {/* 5. User Rights */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Your Privacy Rights (GDPR / CCPA)</h2>
            <p>
              You have the right to access, export, or permanently delete your account and inspection history at any time. To request complete data erasure, contact our privacy officer.
            </p>
          </section>

          {/* 6. Contact */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">6. Privacy Inquiries</h2>
            <p>
              If you have any questions about this Privacy Policy, please reach out to <span className="font-mono text-cyan-400">privacy@sonichecks.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
