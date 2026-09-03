'use client';

import React from 'react';
import { AlertTriangle, Disc, Sliders, Sparkles, TrendingUp } from 'lucide-react';
import { ConsistencyIssue } from '@/types/qc';

interface ConsistencyAlertBannerProps {
  issues: ConsistencyIssue[];
}

export default function ConsistencyAlertBanner({ issues }: ConsistencyAlertBannerProps) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="w-full rounded-2xl bg-amber-950/20 border border-amber-500/30 p-5 sm:p-6 space-y-3">
      <div className="flex items-center gap-2.5 text-amber-400">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <h4 className="font-bold text-sm sm:text-base tracking-tight">
          Batch Consistency &amp; Outlier Observations ({issues.length})
        </h4>
      </div>
      <p className="text-xs text-slate-300">
        Sonichecks cross-referenced all files in this batch. The following cross-file differences and potential outliers were detected:
      </p>

      <div className="space-y-2 pt-1">
        {issues.map((issue, idx) => {
          const isOutlier = issue.issue_type === 'OUTLIER';
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-start gap-2.5 ${
                isOutlier
                  ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                  : 'bg-slate-900/80 border-amber-500/20 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${
                  isOutlier
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isOutlier ? 'Potential Outlier' : 'Inconsistency'}
                </span>
                <span className="font-bold text-slate-200">{issue.metric}:</span>
              </div>
              <div className="flex-1 leading-relaxed">
                <span>{issue.message}</span>
                {issue.affected_files && issue.affected_files.length > 0 && (
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    Flagged track(s): <span className="font-mono text-cyan-300">{issue.affected_files.join(', ')}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
