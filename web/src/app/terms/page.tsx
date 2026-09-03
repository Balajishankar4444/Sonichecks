import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — Sonichecks',
  description: 'Terms of Service and conditions for using Sonichecks Audio Quality Control SaaS.'
};

export default function TermsPage() {
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
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last updated: September 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* 1. Description */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Service Description</h2>
            <p>
              Sonichecks provides an automated, deterministic web-based audio quality control (&ldquo;QC&rdquo;) platform. The service decodes and analyzes audio files directly in your browser against technical digital signal processing standards (including ITU-R BS.1770-4 loudness, True Peak oversampling, digital clipping detection, silence duration, and multi-track consistency) to report PASS, WARNING, or FAIL compliance verdicts.
            </p>
            <p>
              Sonichecks is strictly a quality assessment tool and does NOT modify, master, synthesize, or process the musical composition of your audio recordings.
            </p>
          </section>

          {/* 2. User Intellectual Property */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. User Audio &amp; Intellectual Property</h2>
            <p>
              <strong>You retain 100% full ownership, copyright, and intellectual property rights</strong> to all audio files, compositions, masters, and recordings inspected using Sonichecks.
            </p>
            <p>
              Sonichecks does not claim any license, ownership, or derivative rights over your creative works. All audio processing runs locally inside your browser client; no audio recordings are uploaded or stored on our servers.
            </p>
          </section>

          {/* 3. Acceptable Use */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Acceptable Use Policy</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Attempt to reverse-engineer, decompile, or disrupt the service infrastructure or client code;</li>
              <li>Circumvent subscription tier limits or batch quotas through unauthorized automation or scripted attacks;</li>
              <li>Use the service for any fraudulent or unlawful purposes.</li>
            </ul>
          </section>

          {/* 4. Subscriptions, Pricing & Billing */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Subscriptions, Pricing &amp; Billing Terms</h2>
            <p>
              Sonichecks provides free access (5 checks/month) and paid subscription tiers (Pro at €4.99/mo and Studio at €14.99/mo).
            </p>
            <p>
              Payments are processed securely via our payment partner, Creem. Paid subscriptions renew automatically on a monthly basis until cancelled. You may cancel your subscription at any time with 1 click in your dashboard.
            </p>
          </section>

          {/* 5. Non-Refundable Policy */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Non-Refundable Policy (All Sales Final)</h2>
            <p>
              Because Sonichecks provides immediate digital access and computing quota upon purchase, <strong>all subscription fees are non-refundable</strong> as outlined in our <Link href="/refunds" className="text-cyan-400 hover:underline">Refund &amp; Cancellation Policy</Link>. Upon cancellation, you retain access until the end of your current prepaid billing cycle.
            </p>
          </section>

          {/* 6. Service Limitations & Disclaimer */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">6. Service Limitations &amp; Disclaimer</h2>
            <p>
              While Sonichecks utilizes strict mathematical algorithms (ITU-R BS.1770-4, 4x polyphase filtering, EBU R128), delivery specifications vary among distributors, streaming platforms, and broadcast networks. Sonichecks reports are technical quality assessments and do not constitute a legal guarantee of third-party platform acceptance.
            </p>
            <p className="uppercase text-[11px] text-slate-400">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
          </section>

          {/* 7. Limitation of Liability */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Sonichecks and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or release deadlines resulting from the use of the service.
            </p>
          </section>

          {/* 8. Contact */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">8. Contact Information</h2>
            <p>
              For legal inquiries, please contact us at <span className="font-mono text-cyan-400">support@sonichecks.com</span> or via our <Link href="/contact" className="text-cyan-400 hover:underline">Contact Form</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
