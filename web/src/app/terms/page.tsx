import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft } from 'lucide-react';

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
              Sonichecks provides an automated, deterministic web-based audio quality control (&ldquo;QC&rdquo;) utility. The service evaluates user-uploaded audio files against technical digital signal processing criteria (including ITU-R BS.1770-4 loudness, True Peak oversampling, hard digital clipping detection, silence duration, and multi-file consistency) to report PASS, WARNING, or FAIL compliance verdicts.
            </p>
            <p>
              Sonichecks is strictly an inspection utility and does NOT modify, master, synthesize, or process the musical composition of your audio files.
            </p>
          </section>

          {/* 2. User Intellectual Property */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. User Audio &amp; Intellectual Property</h2>
            <p>
              <strong>You retain 100% full ownership, copyright, and intellectual property rights</strong> to all audio files, metadata, recordings, and content uploaded to Sonichecks.
            </p>
            <p>
              Sonichecks does not claim any license, ownership, or derivative rights over your creative works. Uploaded audio files are stored in isolated temporary runtime memory solely for the purpose of executing the requested technical calculations and are immediately purged after processing.
            </p>
          </section>

          {/* 3. Acceptable Use */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Acceptable Use Policy</h2>
            <p>You agree not to use Sonichecks to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Upload malicious payloads, corrupted binaries designed to exploit codecs, or harmful code;</li>
              <li>Attempt to reverse-engineer, decompile, or disrupt the service infrastructure or API rate limits;</li>
              <li>Exceed maximum batch size (50 files) or file size limits (250MB) through automated denial-of-service attempts;</li>
              <li>Use the service for any unlawful purpose.</li>
            </ul>
          </section>

          {/* 4. Subscriptions & Payment Terms */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Subscriptions, Limits &amp; Billing</h2>
            <p>
              Sonichecks offers free tier access and paid monthly subscription plans (such as Pro and Studio). Usage limits (e.g. monthly file allowances) apply according to your selected plan.
            </p>
            <p>
              Failed audio uploads or corrupted files do not consume check credits. Paid subscriptions are billed on a recurring monthly schedule and can be cancelled at any time via your account settings.
            </p>
          </section>

          {/* 5. Service Limitations & Disclaimer */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Service Limitations &amp; Disclaimer</h2>
            <p>
              While Sonichecks utilizes standard mathematical algorithms (ITU-R BS.1770-4, polyphase filtering, EBU R128), delivery requirements vary by distributor, broadcaster, and platform aggregator. Sonichecks reports are technical quality assessments and do not constitute a legal or contractual guarantee of third-party platform acceptance.
            </p>
            <p className="uppercase text-[11px] text-slate-400">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Sonichecks and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or release deadlines resulting from the use of the service.
            </p>
          </section>

          {/* 7. Contact */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">7. Contact Information</h2>
            <p>
              For legal and terms inquiries, please contact <span className="font-mono text-cyan-400">legal@sonichecks.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
