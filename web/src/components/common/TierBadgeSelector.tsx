'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, ArrowRight, Zap, Crown, UserCheck } from 'lucide-react';
import { getUsageState, updatePlan, UsageState } from '@/lib/storage';
import { ProductTier, TIER_CONFIGS } from '@/config/tiers';
import { useAuth } from '@/context/AuthContext';

export default function TierBadgeSelector() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageState | null>(null);

  useEffect(() => {
    setUsage(getUsageState(user?.email || undefined));
  }, [user]);

  if (!usage) return null;

  const currentTier = usage.plan.toUpperCase() as ProductTier;
  const config = TIER_CONFIGS[currentTier] || TIER_CONFIGS.FREE;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
        <span className="text-slate-400">Plan:</span>
        <span className={`font-bold uppercase tracking-wider ${
          currentTier === 'STUDIO' ? 'text-purple-400' : currentTier === 'PRO' ? 'text-cyan-400' : 'text-slate-200'
        }`}>
          {config.name}
        </span>
        <span className="text-slate-500 font-mono">
          ({user?.filesChecked ?? usage.filesChecked}/{currentTier === 'STUDIO' ? 'Unlimited' : config.monthlyFileLimit})
        </span>
      </div>

      {currentTier === 'FREE' ? (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-sm transition-all"
        >
          <Sparkles className="w-3 h-3" />
          <span>Upgrade to Pro (€4.99)</span>
        </Link>
      ) : (
        <Link
          href="/pricing"
          className="text-slate-400 hover:text-cyan-400 text-xs transition-colors"
        >
          Manage Plan
        </Link>
      )}
    </div>
  );
}
