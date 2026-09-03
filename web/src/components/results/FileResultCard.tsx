'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  FileAudio, 
  Sliders, 
  Sparkles, 
  Info,
  Wrench,
  Volume2,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { FileQCResult, QCStatus } from '@/types/qc';

interface FileResultCardProps {
  result: FileQCResult;
  onRetry?: (filename: string) => void;
  isRetrying?: boolean;
}

export default function FileResultCard({ result, onRetry, isRetrying = false }: FileResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { filename, file_info, loudness, peaks, clipping, silence, checks, overall_status, fix_summary, error_message } = result;

  const getStatusBadge = (status: QCStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓ PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚠ WARNING</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/20 border border-rose-500/40 text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>❌ ERROR</span>
          </span>
        );
      case 'FAIL':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>✕ FAIL</span>
          </span>
        );
    }
  };

  const getCheckIcon = (status: QCStatus) => {
    switch (status) {
      case 'PASS':
        return <span className="text-emerald-400 font-bold">✓</span>;
      case 'WARNING':
        return <span className="text-amber-400 font-bold">⚠</span>;
      case 'ERROR':
      case 'FAIL':
      default:
        return <span className="text-rose-400 font-bold">✕</span>;
    }
  };

  // Handle Errored / Corrupted File Card
  if (overall_status === 'ERROR' || !file_info) {
    return (
      <div className="w-full rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 sm:p-6 space-y-4 shadow-lg transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {filename}
              </h3>
              <p className="text-xs text-rose-300/90 mt-0.5">
                {error_message || 'Unable to analyze this file. The file may be corrupted or use an unsupported codec.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {getStatusBadge('ERROR')}
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(filename)}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              >
                {isRetrying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const borderClass = overall_status === 'PASS' 
    ? 'border-slate-800 hover:border-emerald-500/40' 
    : overall_status === 'WARNING'
    ? 'border-amber-500/40 bg-amber-950/10'
    : 'border-rose-500/40 bg-rose-950/10';

  return (
    <div className={`w-full rounded-2xl border bg-slate-900/60 transition-all duration-200 shadow-lg ${borderClass}`}>
      {/* Main Track Header */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              overall_status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              overall_status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              <FileAudio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {filename}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-cyan-400">{file_info.format}</span>
                <span>&bull;</span>
                <span>{file_info.sample_rate / 1000} kHz</span>
                <span>&bull;</span>
                <span>{file_info.bit_depth ? `${file_info.bit_depth}-bit` : 'N/A'}</span>
                <span>&bull;</span>
                <span>{file_info.channel_layout}</span>
                <span>&bull;</span>
                <span>{file_info.duration_seconds}s</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {getStatusBadge(overall_status)}
            {(overall_status === 'FAIL' || overall_status === 'WARNING') && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(filename)}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
                title="Retry single file analysis"
              >
                {isRetrying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>

        {/* Check Metrics List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
          {checks.map((check, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-4 flex items-center justify-center flex-shrink-0">
                  {getCheckIcon(check.status)}
                </div>
                <span className="font-medium text-slate-300 truncate">{check.name}</span>
              </div>
              <div className="text-right flex-shrink-0 pl-2">
                <span className={`font-mono font-semibold ${
                  check.status === 'PASS' ? 'text-slate-200' :
                  check.status === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {check.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Actionable Fix Box if Failure or Warning */}
        {fix_summary && fix_summary.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Wrench className="w-4 h-4" />
              <span>Recommended Fixes & Actions:</span>
            </div>
            <ul className="space-y-1.5 text-slate-200 pl-6 list-disc">
              {fix_summary.map((fix, idx) => (
                <li key={idx} className="leading-relaxed font-medium">
                  {fix}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Drawer Toggle */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>{isExpanded ? 'Hide Technical Details' : 'View Full Technical Breakdown'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Technical Inspection Details */}
      {isExpanded && (
        <div className="p-5 sm:p-6 bg-slate-950/80 border-t border-slate-800 space-y-5 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Loudness Details */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Loudness (BS.1770-4)</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Integrated:</span>
                  <span className="font-mono text-white font-semibold">
                    {loudness?.integrated_lufs !== null && loudness?.integrated_lufs !== undefined ? `${loudness.integrated_lufs} LUFS` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Short-Term Max:</span>
                  <span className="font-mono text-white">
                    {loudness?.short_term_max_lufs !== null && loudness?.short_term_max_lufs !== undefined ? `${loudness.short_term_max_lufs} LUFS` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Momentary Max:</span>
                  <span className="font-mono text-white">
                    {loudness?.momentary_max_lufs !== null && loudness?.momentary_max_lufs !== undefined ? `${loudness.momentary_max_lufs} LUFS` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Loudness Range (LRA):</span>
                  <span className="font-mono text-white">
                    {loudness?.loudness_range_lu !== null && loudness?.loudness_range_lu !== undefined ? `${loudness.loudness_range_lu} LU` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Peak & Clipping Details */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Peaks & Clipping</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sample Peak:</span>
                  <span className="font-mono text-white font-semibold">
                    {peaks?.sample_peak_dbfs !== undefined ? `${peaks.sample_peak_dbfs} dBFS` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">True Peak (4x Sinc):</span>
                  <span className="font-mono text-white font-semibold">
                    {peaks?.true_peak_dbtp !== undefined ? `${peaks.true_peak_dbtp} dBTP` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clipping Events:</span>
                  <span className="font-mono text-white">{clipping?.consecutive_clipped_runs ?? 0} runs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clipped Samples:</span>
                  <span className={`font-mono ${clipping && clipping.clipped_samples > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                    {(clipping?.clipped_samples ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Silence & File Structure */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Silence & File Info</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Leading Silence:</span>
                  <span className="font-mono text-white">{silence?.leading_silence_sec ?? 0}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trailing Silence:</span>
                  <span className="font-mono text-white">{silence?.trailing_silence_sec ?? 0}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Samples:</span>
                  <span className="font-mono text-white">{file_info.num_samples.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Codec / Subtype:</span>
                  <span className="font-mono text-white">{file_info.codec || file_info.format}</span>
                </div>
                {file_info.sha256_hash && (
                  <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-800">
                    <span className="text-slate-400">SHA-256 Hash:</span>
                    <span className="font-mono text-[10px] text-cyan-300 break-all">{file_info.sha256_hash}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
