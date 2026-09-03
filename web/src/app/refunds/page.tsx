import React from 'react';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

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
            <span>Billing &amp; Refunds</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs text-slate-400">
            Transparent and fair subscription policies for all Sonichecks users.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* 1. Subscription Cancellation */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Subscription Cancellation</h2>
            <p>
              You may cancel your Sonichecks subscription (Pro or Studio) at any time directly through your account dashboard or billing portal.
            </p>
            <p>
              There are no cancellation fees or long-term contracts. Upon cancelling, your subscription will not renew at the next billing date.
            </p>
          </section>

          {/* 2. When Access Ends */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Access Period Post-Cancellation</h2>
            <p>
              When you cancel a paid plan, you will retain full access to your plan features (including batch limits, PDF reports, and remaining monthly file allowances) until the end of your current prepaid billing cycle.
            </p>
            <p>
              Once the cycle concludes, your account will automatically downgrade to the Free plan (5 files/month) without deleting your past QC history.
            </p>
          </section>

          {/* 3. Refund Policy */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Refund Conditions</h2>
            <p>We want you to be completely satisfied with Sonichecks:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>14-Day Guarantee:</strong> If you upgraded to a paid plan and are unsatisfied with the quality control engine or encountered unresolvable technical issues, contact support within 14 days of your initial purchase for a full refund.</li>
              <li><strong>Fair Usage:</strong> Refunds are intended for genuine dissatisfaction and technical concerns; accounts that have consumed substantial monthly batch volume before requesting a refund may be evaluated on a case-by-case basis.</li>
            </ul>
          </section>

          {/* 4. Failed Payments & Grace Period */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Failed Payments &amp; Grace Period</h2>
            <p>
              If a recurring subscription payment fails (e.g. due to an expired credit card), we provide a 7-day grace period with automatic retry attempts before downgrading your account. You will receive an automated email notice to update your payment method.
            </p>
          </section>

          {/* 5. Free Plan Rules */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Free Plan Usage</h2>
            <p>
              The Sonichecks Free plan is 100% free with no credit card required. Free checks reset automatically at the beginning of each calendar month. Unused file credits do not roll over between months.
            </p>
          </section>

          {/* 6. Contact */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">6. Requesting a Refund</h2>
            <p>
              To request a refund or ask a billing question, please email <span className="font-mono text-cyan-400">billing@sonichecks.com</span> with your account email address. We respond within 1 business day.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
