'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  Volume2, 
  Clock, 
  Wrench, 
  HelpCircle, 
  Play, 
  Activity,
  Layers,
  FileAudio
} from 'lucide-react';
import { FileQCResult, QCRuleCheck, QCStatus } from '@/types/qc';
import { ProductTier } from '@/config/tiers';
import { Lock, Sparkles } from 'lucide-react';

interface FindingsPanelProps {
  result: FileQCResult;
  onAuditionFinding?: (timestampSec: number, findingName: string) => void;
  activeFindingTimestamp?: number | null;
  userTier?: ProductTier;
  onGatedAction?: (featureName: string, description: string, requiredTier: ProductTier) => void;
}

export default function FindingsPanel({
  result,
  onAuditionFinding,
  activeFindingTimestamp,
  userTier = 'PRO',
  onGatedAction
}: FindingsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    // Default open the first failed check or warning
    const firstIssue = result.checks.find(c => c.status === 'FAIL') || result.checks.find(c => c.status === 'WARNING');
    return firstIssue ? (firstIssue.id || firstIssue.name) : null;
  });

  const isFree = userTier === 'FREE';

  const failures = result.checks.filter(c => c.status === 'FAIL');
  const warnings = result.checks.filter(c => c.status === 'WARNING');
  const passes = result.checks.filter(c => c.status === 'PASS');

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleAuditionClick = (e: React.MouseEvent, timestampSec: number, findingName: string) => {
    e.stopPropagation();
    if (isFree && onGatedAction) {
      onGatedAction(
        'Listen Around Finding',
        'Instantly audition audio around exact problem locations with configurable pre-roll and post-roll on Pro and Studio plans.',
        'PRO'
      );
      return;
    }
    if (onAuditionFinding) {
      onAuditionFinding(timestampSec, findingName);
    }
  };

  const renderFindingCard = (check: QCRuleCheck, index: number) => {
    const checkId = check.id || `${check.name}_${index}`;
    const isExpanded = expandedId === checkId;
    const isFail = check.status === 'FAIL';
    const isWarn = check.status === 'WARNING';
    const isPass = check.status === 'PASS';

    const statusBorder = isFail 
      ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500/60' 
      : isWarn 
      ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/60' 
      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700';

    const badgeStyle = isFail
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : isWarn
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

    const StatusIcon = isFail ? XCircle : isWarn ? AlertTriangle : CheckCircle2;

    return (
      <div 
        key={checkId} 
        className={`rounded-xl border transition-all duration-200 overflow-hidden ${statusBorder}`}
      >
        {/* Header Summary Row */}
        <div 
          onClick={() => toggleExpand(checkId)}
          className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <StatusIcon className={`w-5 h-5 shrink-0 ${
              isFail ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">
                  {check.name}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                  {check.status}
                </span>
                {check.timestamp_sec !== undefined && check.timestamp_sec !== null && (
                  isFree ? (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        onGatedAction?.('Finding Timestamps', 'Precise timestamp localization of True Peak overs, clipping, and loudness peaks is available on Pro.', 'PRO');
                      }}
                      className="flex items-center gap-1 font-mono text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 cursor-pointer"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Timestamp (Pro)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      <Clock className="w-3 h-3" />
                      {new Date(check.timestamp_sec * 1000).toISOString().substr(14, 8)}
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {check.what || check.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="font-mono text-xs font-bold text-white">
                {check.value}
              </div>
              <div className="text-[10px] text-slate-500">
                Limit: {check.limit}
              </div>
            </div>

            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded Details: What / Why / How / Audition */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3.5 bg-slate-950/50 text-xs">
            {/* Audition Trigger Button if timestamp exists */}
            {check.timestamp_sec !== undefined && check.timestamp_sec !== null && (
              <div className="pt-2 flex items-center justify-between bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/20">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-medium">
                    {isFree ? 'Exact problem location detected in audio stream' : (
                      <>Problem location detected at <strong className="font-mono">{new Date(check.timestamp_sec * 1000).toISOString().substr(14, 8)}</strong></>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleAuditionClick(e, check.timestamp_sec!, check.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition-colors cursor-pointer ${
                    isFree 
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30' 
                      : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                  }`}
                >
                  {isFree ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isFree ? 'Listen (Pro)' : 'Audition Finding'}</span>
                </button>
              </div>
            )}

            {/* WHAT HAPPENED */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>What Happened</span>
              </div>
              <p className="text-slate-300 pl-3 leading-relaxed">
                {check.what || check.message}
              </p>
            </div>

            {/* WHY IT MATTERS */}
            {check.why && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Why It Matters</span>
                </div>
                <p className="text-slate-300 pl-3 leading-relaxed">
                  {check.why}
                </p>
              </div>
            )}

            {/* HOW TO FIX IT */}
            {check.how && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  <span>How To Fix</span>
                </div>
                <p className="text-slate-300 pl-3 leading-relaxed">
                  {check.how}
                </p>
              </div>
            )}

            {/* Measurement vs Limit Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9.5px] uppercase">Measured Value</span>
                <span className="text-white font-bold">{check.value}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[9.5px] uppercase">Required Threshold</span>
                <span className="text-cyan-400 font-bold">{check.limit}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Failures Section */}
      {failures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>Critical Rejection Risks ({failures.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Must fix before delivery</span>
          </div>
          <div className="space-y-2.5">
            {failures.map(renderFindingCard)}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Delivery Warnings ({warnings.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Recommended improvements</span>
          </div>
          <div className="space-y-2.5">
            {warnings.map(renderFindingCard)}
          </div>
        </div>
      )}

      {/* Passed Checks Section */}
      {passes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Compliant Specifications ({passes.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Meets technical requirements</span>
          </div>
          <div className="space-y-2.5">
            {passes.map(renderFindingCard)}
          </div>
        </div>
      )}
    </div>
  );
}
