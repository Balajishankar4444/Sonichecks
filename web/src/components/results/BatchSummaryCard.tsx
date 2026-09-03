'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Volume2, Sparkles, Layers } from 'lucide-react';
import { BatchQCResult, QCStatus } from '@/types/qc';

interface BatchSummaryCardProps {
  batchResult: BatchQCResult;
}

export default function BatchSummaryCard({ batchResult }: BatchSummaryCardProps) {
  const { summary, overall_status, profile_name } = batchResult;

  const getStatusVisuals = (status: QCStatus) => {
    switch (status) {
      case 'PASS':
        return {
          title: 'ALL FILES PASSED QUALITY CONTROL',
          subtitle: 'Your audio meets the delivery requirements and is ready for distribution.',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
          badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          gradientBg: 'from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30'
        };
      case 'WARNING':
        return {
          title: 'QUALITY CONTROL PASSED WITH WARNINGS',
          subtitle: 'Minor deviations detected. Review warning notices before final delivery.',
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          gradientBg: 'from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/30'
        };
      case 'FAIL':
      default:
        return {
          title: 'QUALITY CONTROL FAILED',
          subtitle: 'One or more audio files exceed delivery limits. Review the required fixes below.',
          icon: <XCircle className="w-8 h-8 text-rose-400" />,
          badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          gradientBg: 'from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/30'
        };
    }
  };

  const visuals = getStatusVisuals(overall_status);

  return (
    <div className={`w-full rounded-2xl border p-6 sm:p-8 bg-gradient-to-b ${visuals.gradientBg} shadow-2xl space-y-6`}>
      {/* Top Banner Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
            {visuals.icon}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${visuals.badgeBg}`}>
                {overall_status}
              </span>
              <span className="text-xs text-slate-400">
                Profile: <strong className="text-slate-200">{profile_name}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {visuals.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {visuals.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Files */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Files</p>
          <p className="text-xl font-bold text-white mt-1">{summary.total_files}</p>
        </div>

        {/* Passed */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Passed</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{summary.passed}</p>
        </div>

        {/* Warnings */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Warnings</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{summary.warnings}</p>
        </div>

        {/* Failed */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Failed</p>
          <p className="text-xl font-bold text-rose-400 mt-1">{summary.failed}</p>
        </div>

        {/* Average Loudness */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Avg Loudness</p>
          <p className="text-xl font-bold text-white mt-1">
            {summary.avg_lufs !== null && summary.avg_lufs !== undefined ? `${summary.avg_lufs} LUFS` : 'N/A'}
          </p>
        </div>

        {/* Highest True Peak */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Highest Peak</p>
          <p className="text-xl font-bold text-white mt-1">
            {summary.highest_true_peak_dbtp !== null && summary.highest_true_peak_dbtp !== undefined ? `${summary.highest_true_peak_dbtp} dBTP` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
