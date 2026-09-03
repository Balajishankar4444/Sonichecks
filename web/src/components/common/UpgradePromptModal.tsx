'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, X, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProductTier } from '@/config/tiers';

export interface UpgradePromptState {
  isOpen: boolean;
  featureName: string;
  description: string;
  requiredTier: ProductTier;
}

interface UpgradePromptModalProps {
  prompt: UpgradePromptState | null;
  onClose: () => void;
}

export default function UpgradePromptModal({ prompt, onClose }: UpgradePromptModalProps) {
  if (!prompt || !prompt.isOpen) return null;

  const { featureName, description, requiredTier } = prompt;
  const isStudio = requiredTier === 'STUDIO';
  const planName = isStudio ? 'Studio' : 'Pro';
  const planPrice = isStudio ? '€14.99/month' : '€4.99/month';

  const proFeatures = [
    'Up to 100 audio files / month',
    'Batch QC upload (up to 50 files per batch)',
    'Batch QC Comparison Matrix',
    'Professional PDF QC Certificates with SHA-256 hashes',
    'CSV Batch Exports',
    'Streaming, EBU R128 & ACX Profiles',
    'Inspection history & saved settings'
  ];

  const studioFeatures = [
    'Up to 500 audio files / month',
    'Bulk batches up to 200 files',
    'Multi-track client & project organization',
    'Project-level reports and unified history',
    'Custom QC Profile Builder',
    'Priority processing throughput'
  ];

  const featureList = isStudio ? studioFeatures : proFeatures;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden shadow-cyan-950/80 p-6 sm:p-8 space-y-6">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {planName} Feature
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {featureName}
            </h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {description}
        </p>

        {/* Plan Value Breakdown */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span>What you unlock with {planName} ({planPrice}):</span>
          </div>
          <ul className="grid grid-cols-1 gap-2 text-xs text-slate-300">
            {featureList.slice(0, 5).map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/pricing"
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-xs text-center text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Upgrade to {planName} — {planPrice}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
