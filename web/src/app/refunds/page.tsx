import React from 'react';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy — Sonichecks',
  description: 'Refund, billing cancellation, and renewal terms for Sonichecks subscriptions.'
};

export default function RefundsPage() {
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
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Billing &amp; Cancellation Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs text-slate-400">
            Subscription terms and non-refundable policy for Sonichecks digital services.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* 1. No Refund Policy */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>1. No Refund Policy (All Sales Final)</span>
            </h2>
            <p>
              Because Sonichecks provides immediate digital access, cryptographic report generation, and automated cloud quota allowances upon payment, <strong>all purchases and subscription fees are strictly non-refundable</strong>.
            </p>
            <p>
              We encourage users to test the platform using our <strong>Free plan (5 checks/month)</strong> to evaluate the accuracy of the audio engine and inspection reports prior to upgrading to a paid tier.
            </p>
          </section>

          {/* 2. Subscription Cancellation */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Subscription Cancellation</h2>
            <p>
              You may cancel your Sonichecks subscription (Pro or Studio) at any time directly through your account dashboard.
            </p>
            <p>
              There are no cancellation fees or long-term commitments. Once cancelled, your subscription will not renew for any subsequent billing cycles.
            </p>
          </section>

          {/* 3. Access Period Post-Cancellation */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Access Period Post-Cancellation</h2>
            <p>
              When you cancel your subscription, you will retain full access to your paid tier features (including batch size limits, matrix view, and monthly file allowance) until the end of your current prepaid billing period.
            </p>
            <p>
              Once your current period concludes, your account will revert to the Free tier without deleting your past QC history.
            </p>
          </section>

          {/* 4. Free Tier & Fair Usage */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Free Tier Usage</h2>
            <p>
              The Sonichecks Free tier is permanently available with no credit card required. Free checks reset automatically at the beginning of each calendar month. Unused file allowances do not roll over.
            </p>
          </section>

          {/* 5. Support & Inquiries */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Support &amp; Billing Inquiries</h2>
            <p>
              If you have questions regarding your invoices, subscriptions, or encounter technical errors, please reach out through our <Link href="/contact" className="text-cyan-400 hover:underline">Contact Form</Link> or email us at <span className="font-mono text-cyan-400">support@sonichecks.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
