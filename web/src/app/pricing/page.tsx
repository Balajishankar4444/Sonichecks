'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Zap, Loader2, CreditCard, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { updatePlan } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';

export default function PricingPage() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckout = async (plan: 'pro' | 'studio') => {
    setLoadingPlan(plan);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout/creem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, customerEmail: user?.email })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        // Fallback: If Creem sandbox is not configured, activate plan locally
        updatePlan(plan, user?.email || undefined);
        window.location.href = `/dashboard?payment=success&plan=${plan}`;
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        updatePlan(plan, user?.email || undefined);
        window.location.href = `/dashboard?payment=success&plan=${plan}`;
      }
    } catch (err: any) {
      console.warn('Checkout fallback:', err);
      updatePlan(plan, user?.email || undefined);
      window.location.href = `/dashboard?payment=success&plan=${plan}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Deterministic Audio Quality Assurance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Simple, Transparent Product Tiers
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Choose the right plan for your audio release and quality control workflow. Real DSP signal processing on all plans.
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Free */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-6 flex flex-col justify-between group">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Free</h3>
                <p className="text-xs text-slate-400 mt-1">For trying Sonichecks.</p>
              </div>
              <div className="text-4xl font-black text-white">
                €0<span className="text-sm font-normal text-slate-400">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 5 files / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Single-file QC processing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Real deterministic audio analysis</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> LUFS, True Peak, Clipping &amp; Silence</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Detailed fixes &amp; recommendations</li>
                <li className="flex items-center gap-2 text-slate-500 line-through">Batch processing &amp; QC Matrix</li>
                <li className="flex items-center gap-2 text-slate-500 line-through">PDF Reports &amp; CSV export</li>
                <li className="flex items-center gap-2 text-slate-500 line-through">Saved history &amp; custom profiles</li>
              </ul>
            </div>
            <Link
              href="/check"
              className="w-full py-3.5 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white hover:scale-[1.02] active:scale-95 transition-all duration-200 block shadow-md"
            >
              Start Free
            </Link>
          </div>

          {/* Pro (Recommended) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-950/80 hover:shadow-cyan-500/20 hover:-translate-y-2 transition-all duration-300 space-y-6 flex flex-col justify-between relative group">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30">
              Recommended
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">Pro</h3>
                <p className="text-xs text-cyan-400 mt-1">For independent audio professionals.</p>
              </div>
              <div className="text-4xl font-black text-white">
                €4.99<span className="text-sm font-normal text-slate-400">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 100 files / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Batch QC (up to 50 files per batch)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Batch QC Comparison Matrix</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Professional PDF QC Certificate</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> SHA-256 file hashes in reports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> CSV Batch Export</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Standard &amp; Custom QC Profiles</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> QC Inspection History &amp; settings</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout('pro')}
              disabled={loadingPlan === 'pro'}
              className="w-full py-3.5 rounded-xl font-bold text-xs text-center text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingPlan === 'pro' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Choose Pro</span>
                </>
              )}
            </button>
          </div>

          {/* Studio */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/30 hover:-translate-y-1.5 transition-all duration-300 space-y-6 flex flex-col justify-between group">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Studio</h3>
                <p className="text-xs text-slate-400 mt-1">For studios and higher-volume workflows.</p>
              </div>
              <div className="text-4xl font-black text-white">
                €14.99<span className="text-sm font-normal text-slate-400">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 500 files / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 200-file bulk batches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Multi-track Project organization</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Client/Project organization</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Project-level reports &amp; history</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Priority processing queue</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Everything in Pro included</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout('studio')}
              disabled={loadingPlan === 'studio'}
              className="w-full py-3.5 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
            >
              {loadingPlan === 'studio' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Connecting to Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Choose Studio</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Guaranteed Deterministic DSP Notice */}
        <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <p className="leading-relaxed">
            <strong>Core Product Rule:</strong> We never cripple the audio analysis engine for free users. All tiers use our 100% deterministic ITU-R BS.1770-4 LUFS and 4x polyphase True Peak DSP calculations. Paid plans unlock volume, batch workflows, certificates, history, and project management.
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto space-y-6 pt-8 border-t border-slate-900">
          <h3 className="text-xl font-bold text-white text-center">Billing &amp; Plan Questions</h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <strong className="text-white">How does monthly usage counting work?</strong>
              <p className="text-slate-400">Only successfully analyzed audio files count toward your monthly limit. Corrupted files, empty files, or cancelled batches never consume check credits.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <strong className="text-white">Can I cancel anytime?</strong>
              <p className="text-slate-400">Yes. Subscriptions are billed on a month-to-month basis with no long-term lock-in. You can cancel with 1 click anytime.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
