'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, HelpCircle, ArrowRight, Zap } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Fair, Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Plans built for every creator & studio
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Get deterministic audio quality assurance with simple monthly plans. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Free</h3>
                <p className="text-xs text-slate-400 mt-1">For occasional releases and quick spot checks</p>
              </div>
              <div className="text-4xl font-black text-white">
                €0<span className="text-sm font-normal text-slate-400">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 5 audio checks / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Standard Delivery Profile</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Real-time measurements</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> WAV, AIFF, FLAC, MP3</li>
                <li className="flex items-center gap-2 text-slate-400 line-through">PDF QC Certificates</li>
                <li className="flex items-center gap-2 text-slate-400 line-through">Batch Consistency Checks</li>
              </ul>
            </div>
            <Link
              href="/check"
              className="w-full py-3 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Start Free Check
            </Link>
          </div>

          {/* Pro */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-950/60 space-y-6 flex flex-col justify-between relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-md">
              Most Popular
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Pro</h3>
                <p className="text-xs text-cyan-400 mt-1">For active producers, podcasters, & voiceover artists</p>
              </div>
              <div className="text-4xl font-black text-white">
                €5<span className="text-sm font-normal text-slate-400">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 100 audio checks / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Multi-track batch analysis (20 files)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Downloadable PDF Inspection Reports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> CSV Batch Export</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Streaming, EBU R128 & ACX Profiles</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Cross-file consistency warnings</li>
              </ul>
            </div>
            <Link
              href="/check"
              className="w-full py-3 rounded-xl font-bold text-xs text-center text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 transition-all"
            >
              Get Pro Access
            </Link>
          </div>

          {/* Studio */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Studio</h3>
                <p className="text-xs text-slate-400 mt-1">For mastering studios, labels, & post-production teams</p>
              </div>
              <div className="text-4xl font-black text-white">
                €15<span className="text-sm font-normal text-slate-400">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 500 audio checks / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 50-track album batches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Branded PDF reports for clients</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Custom QC profile builder</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Priority processing queue</li>
              </ul>
            </div>
            <Link
              href="/check"
              className="w-full py-3 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Get Studio Access
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto space-y-6 pt-8 border-t border-slate-900">
          <h3 className="text-xl font-bold text-white text-center">Billing & Plan Questions</h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <strong className="text-white">How does usage counting work?</strong>
              <p className="text-slate-400">Only successfully analyzed files count toward your monthly limit. Failed uploads, empty files, or rejected formats never consume credits.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <strong className="text-white">Can I cancel anytime?</strong>
              <p className="text-slate-400">Yes. Subscriptions are billed on a monthly basis without long-term contracts. You can cancel with 1 click anytime.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
