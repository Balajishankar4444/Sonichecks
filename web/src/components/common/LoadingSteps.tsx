'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, CircleDashed, Ban, Waves } from 'lucide-react';
import { QCStatus } from '@/types/qc';

export interface FileAnalysisStatus {
  filename: string;
  status: 'WAITING' | 'ANALYZING' | 'DONE';
  qcResultStatus?: QCStatus;
  errorMessage?: string;
}

interface LoadingStepsProps {
  totalFiles: number;
  completedCount: number;
  currentFilename?: string;
  fileStatuses?: FileAnalysisStatus[];
  onCancel?: () => void;
}

export default function LoadingSteps({
  totalFiles,
  completedCount,
  currentFilename,
  fileStatuses = [],
  onCancel
}: LoadingStepsProps) {
  const percent = totalFiles > 0 ? Math.round((completedCount / totalFiles) * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
            <Waves className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Analyzing {totalFiles} {totalFiles === 1 ? 'Audio File' : 'Audio Files'}...
            </h3>
            <p className="text-xs text-slate-400">
              {currentFilename ? `Inspecting: ${currentFilename}` : 'DSP engine processing audio stream...'}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            <span>Cancel Analysis</span>
          </button>
        )}
      </div>

      {/* Real Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-300">
          <span>Real Analysis Progress</span>
          <span className="font-mono text-cyan-400 font-bold">
            {completedCount} / {totalFiles} ({percent}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Per-File Status List */}
      {fileStatuses.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Queue Breakdown
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {fileStatuses.map((f, idx) => {
              let icon = <CircleDashed className="w-4 h-4 text-slate-400" />;
              let badgeText = 'Waiting';
              let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';

              if (f.status === 'ANALYZING') {
                icon = <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
                badgeText = 'Analyzing';
                badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
              } else if (f.status === 'DONE') {
                if (f.qcResultStatus === 'PASS') {
                  icon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                  badgeText = 'Passed';
                  badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                } else if (f.qcResultStatus === 'WARNING') {
                  icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
                  badgeText = 'Warning';
                  badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                } else if (f.qcResultStatus === 'ERROR') {
                  icon = <XCircle className="w-4 h-4 text-rose-400" />;
                  badgeText = 'Error';
                  badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                } else {
                  icon = <XCircle className="w-4 h-4 text-rose-400" />;
                  badgeText = 'Failed';
                  badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                }
              }

              return (
                <div
                  key={`${f.filename}-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <span className="font-medium text-slate-200 truncate">{f.filename}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor} flex-shrink-0 ml-2`}>
                    {badgeText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
