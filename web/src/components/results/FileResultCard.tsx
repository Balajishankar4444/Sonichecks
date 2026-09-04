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
  Loader2,
  Lock,
  Activity,
  FileText
} from 'lucide-react';
import { FileQCResult, QCStatus } from '@/types/qc';
import FindingsPanel from '@/components/qc/FindingsPanel';
import WaveformEvidence from '@/components/qc/WaveformEvidence';
import FindingAuditionPlayer from '@/components/qc/FindingAuditionPlayer';
import { downloadPdfCertificate } from '@/lib/reports/pdf-export';
import { ProductTier } from '@/config/tiers';

interface FileResultCardProps {
  result: FileQCResult;
  onRetry?: (filename: string) => void;
  isRetrying?: boolean;
  audioFile?: File | null;
  userTier?: ProductTier;
  onGatedAction?: (featureName: string, description: string, requiredTier: ProductTier) => void;
}

export default function FileResultCard({ 
  result, 
  onRetry, 
  isRetrying = false,
  audioFile,
  userTier = 'PRO',
  onGatedAction
}: FileResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [auditionFinding, setAuditionFinding] = useState<{ timestampSec: number; label: string } | null>(null);

  const isFree = userTier === 'FREE';

  const { filename, file_info, loudness, peaks, clipping, silence, checks, overall_status, fix_summary, error_message } = result;

  const getStatusBadge = (status: QCStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓ READY TO DELIVER</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚠ DELIVERY WARNING</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/20 border border-rose-500/40 text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>❌ CORRUPTED / ERROR</span>
          </span>
        );
      case 'FAIL':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>✕ NOT READY TO DELIVER</span>
          </span>
        );
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

  const handleAuditionTrigger = (timestampSec: number, findingName: string) => {
    setAuditionFinding({ timestampSec, label: findingName });
  };

  return (
    <div className={`w-full rounded-2xl border bg-slate-900/60 transition-all duration-200 shadow-xl ${borderClass}`}>
      {/* Main Track Header */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
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
                <span className="font-mono text-cyan-400 font-bold">{file_info.format}</span>
                <span>&bull;</span>
                <span>{file_info.sample_rate / 1000} kHz</span>
                <span>&bull;</span>
                <span>{file_info.bit_depth ? `${file_info.bit_depth}-bit` : '24-bit'}</span>
                <span>&bull;</span>
                <span>{file_info.channel_layout}</span>
                <span>&bull;</span>
                <span>{new Date((file_info.duration_seconds || 0) * 1000).toISOString().substr(14, 8)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            {getStatusBadge(overall_status)}

            <button
              type="button"
              onClick={() => {
                if (isFree && onGatedAction) {
                  onGatedAction(
                    'Professional PDF QC Certificate',
                    'Downloadable timestamped PDF certificates with SHA-256 verification hashes are available on Pro and Studio plans.',
                    'PRO'
                  );
                  return;
                }
                downloadPdfCertificate(result);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isFree 
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-amber-500/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isFree ? 'PDF Certificate (Pro)' : 'Download QC Certificate PDF'}
            >
              {isFree ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <FileText className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isFree ? 'Certificate (Pro)' : 'Certificate'}</span>
            </button>

            {(overall_status === 'FAIL' || overall_status === 'WARNING') && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(filename)}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
                title="Retry analysis"
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

        {/* Cryptographic File Integrity Tag */}
        {file_info.sha256_hash && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-bold text-slate-300">File Integrity (SHA-256):</span>
              <span className="font-mono text-cyan-300 truncate">{file_info.sha256_hash}</span>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0">100% Deterministic DSP</span>
          </div>
        )}

        {/* Embedded Audition Player (if finding audition triggered) */}
        {auditionFinding && (
          <FindingAuditionPlayer
            audioFile={audioFile}
            targetTimestampSec={auditionFinding.timestampSec}
            findingLabel={auditionFinding.label}
            onClose={() => setAuditionFinding(null)}
          />
        )}

        {/* Waveform Evidence View */}
        <WaveformEvidence
          result={result}
          onJumpToTimestamp={(t) => setAuditionFinding({ timestampSec: t, label: 'Timeline Finding' })}
          activeTimestamp={auditionFinding?.timestampSec}
          userTier={userTier}
          onGatedAction={onGatedAction}
        />

        {/* Structured Findings Panel with What / Why / How */}
        <div className="pt-2">
          <FindingsPanel
            result={result}
            onAuditionFinding={handleAuditionTrigger}
            activeFindingTimestamp={auditionFinding?.timestampSec}
            userTier={userTier}
            onGatedAction={onGatedAction}
          />
        </div>
      </div>
    </div>
  );
}
