'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  BarChart3, 
  Clock, 
  FileAudio, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowUpRight, 
  Plus,
  Layers,
  Sparkles,
  FileDown
} from 'lucide-react';
import { BatchQCResult } from '@/types/qc';
import { getSavedHistory, getUsageState, UsageState } from '@/lib/storage';
import { downloadPdfReport } from '@/lib/api';

export default function DashboardPage() {
  const [history, setHistory] = useState<BatchQCResult[]>([]);
  const [usage, setUsage] = useState<UsageState | null>(null);

  useEffect(() => {
    setHistory(getSavedHistory());
    setUsage(getUsageState());
  }, []);

  const totalFilesChecked = history.reduce((sum, b) => sum + b.summary.total_files, 0);
  const totalPassed = history.reduce((sum, b) => sum + b.summary.passed, 0);
  const totalFailed = history.reduce((sum, b) => sum + b.summary.failed, 0);
  const passRate = totalFilesChecked > 0 ? Math.round((totalPassed / totalFilesChecked) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              QC Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Overview of your recent audio inspections, usage limits, and compliance history.
            </p>
          </div>

          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-md shadow-cyan-500/20 active:scale-95 transition-all self-start sm:self-center"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Audio QC Check</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Usage */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Monthly Usage ({usage?.month || 'Current'})
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {usage?.filesChecked || 0} <span className="text-xs font-normal text-slate-400">/ {usage?.maxMonthlyLimit || 5} files</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {usage?.plan || 'Free'} Plan
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
              <div 
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, ((usage?.filesChecked || 0) / (usage?.maxMonthlyLimit || 5)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Total Files Checked */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Inspected
            </span>
            <p className="text-2xl font-black text-white">
              {totalFilesChecked} <span className="text-xs font-normal text-slate-400">tracks</span>
            </p>
            <p className="text-[11px] text-slate-400">Across {history.length} inspection runs</p>
          </div>

          {/* Pass Rate */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Pass Rate
            </span>
            <p className="text-2xl font-black text-emerald-400">
              {passRate}%
            </p>
            <p className="text-[11px] text-slate-400">{totalPassed} passed &bull; {totalFailed} failed</p>
          </div>

          {/* Saved Profiles */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Active Profiles
            </span>
            <p className="text-2xl font-black text-white">
              5 <span className="text-xs font-normal text-slate-400">standards</span>
            </p>
            <p className="text-[11px] text-slate-400">Standard, Streaming, EBU, ACX, Club</p>
          </div>
        </div>

        {/* Recent Checks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent Quality Checks</span>
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
              <FileAudio className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No checks completed yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload your audio files to run your first automated quality control inspection.
                </p>
              </div>
              <Link
                href="/check"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Run First Check</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((batch) => {
                const dateStr = new Date(batch.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={batch.batch_id}
                    className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          batch.overall_status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          batch.overall_status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {batch.overall_status}
                        </span>
                        <span className="font-bold text-sm text-white">
                          {batch.summary.total_files === 1 
                            ? batch.files[0]?.filename || '1 Audio File'
                            : `${batch.summary.total_files} Files Batch`}
                        </span>
                        <span className="text-xs text-slate-400">&bull;</span>
                        <span className="text-xs text-slate-400">{batch.profile_name}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <span>{dateStr}</span>
                        <span>&bull;</span>
                        <span>Avg: <strong className="text-slate-300">{batch.summary.avg_lufs ? `${batch.summary.avg_lufs} LUFS` : 'N/A'}</strong></span>
                        <span>&bull;</span>
                        <span>Max Peak: <strong className="text-slate-300">{batch.summary.highest_true_peak_dbtp ? `${batch.summary.highest_true_peak_dbtp} dBTP` : 'N/A'}</strong></span>
                        <span>&bull;</span>
                        <span>Passed: <strong className="text-emerald-400">{batch.summary.passed}</strong></span>
                        {batch.summary.failed > 0 && (
                          <span>&bull; Failed: <strong className="text-rose-400">{batch.summary.failed}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadPdfReport(batch)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                        title="Download PDF"
                      >
                        <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                        <span>PDF Report</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
