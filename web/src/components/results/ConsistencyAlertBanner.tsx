'use client';

import React from 'react';
import { AlertTriangle, Disc, Sliders } from 'lucide-react';
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
          Batch Consistency Observations ({issues.length})
        </h4>
      </div>
      <p className="text-xs text-slate-300">
        Sonichecks cross-referenced all files in this batch. The following variations between tracks were identified:
      </p>

      <div className="space-y-2 pt-1">
        {issues.map((issue, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-start gap-2"
          >
            <span className="font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit">
              {issue.metric}
            </span>
            <span className="text-slate-300 leading-relaxed">
              {issue.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
