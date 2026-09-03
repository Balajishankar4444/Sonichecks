'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Lock,
  Table,
  Sparkles,
  Info
} from 'lucide-react';
import { BatchQCResult, FileQCResult, QCStatus } from '@/types/qc';
import FileResultCard from './FileResultCard';

export type MatrixSortColumn = 
  | 'FILENAME' 
  | 'STATUS' 
  | 'SAMPLE_RATE' 
  | 'BIT_DEPTH' 
  | 'DURATION' 
  | 'LUFS' 
  | 'TRUE_PEAK' 
  | 'SAMPLE_PEAK' 
  | 'WARNINGS' 
  | 'FAILURES';

export type SortDirection = 'asc' | 'desc';

interface BatchComparisonMatrixProps {
  batchResult: BatchQCResult;
  isGated?: boolean;
  onUpgradeClick?: () => void;
  onSelectFileDetail?: (file: FileQCResult) => void;
}

export default function BatchComparisonMatrix({
  batchResult,
  isGated = false,
  onUpgradeClick,
  onSelectFileDetail
}: BatchComparisonMatrixProps) {
  const [sortColumn, setSortColumn] = useState<MatrixSortColumn>('FILENAME');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedModalFile, setSelectedModalFile] = useState<FileQCResult | null>(null);

  // Determine majority batch values for difference highlighting
  const majorityStats = useMemo(() => {
    const valid = (batchResult?.files || []).filter((f) => Boolean(f && f.file_info));
    if (valid.length === 0) return { sr: null, bd: null, fmt: null, layout: null };

    const getMode = (arr: any[]) => {
      const counts: Record<string, number> = {};
      arr.forEach((v) => {
        if (v !== null && v !== undefined) {
          counts[String(v)] = (counts[String(v)] || 0) + 1;
        }
      });
      let maxCount = 0;
      let mode = null;
      for (const [k, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          mode = k;
        }
      }
      return mode;
    };

    return {
      sr: getMode(valid.map((f) => f.file_info?.sample_rate)),
      bd: getMode(valid.map((f) => f.file_info?.bit_depth)),
      fmt: getMode(valid.map((f) => f.file_info?.format?.toUpperCase())),
      layout: getMode(valid.map((f) => f.file_info?.channel_layout))
    };
  }, [batchResult?.files]);

  // Handle header column sorting
  const handleSort = (column: MatrixSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sorted files
  const sortedFiles = useMemo(() => {
    const files = [...(batchResult?.files || [])];

    files.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'FILENAME':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'STATUS': {
          const statusOrder: Record<QCStatus, number> = {
            ERROR: 4,
            FAIL: 3,
            WARNING: 2,
            PASS: 1,
            NOT_CHECKED: 0
          };
          comparison = statusOrder[b.overall_status] - statusOrder[a.overall_status];
          break;
        }
        case 'SAMPLE_RATE':
          comparison = (a.file_info?.sample_rate ?? 0) - (b.file_info?.sample_rate ?? 0);
          break;
        case 'BIT_DEPTH':
          comparison = (a.file_info?.bit_depth ?? 0) - (b.file_info?.bit_depth ?? 0);
          break;
        case 'DURATION':
          comparison = (a.file_info?.duration_seconds ?? 0) - (b.file_info?.duration_seconds ?? 0);
          break;
        case 'LUFS':
          comparison = (a.loudness?.integrated_lufs ?? -99) - (b.loudness?.integrated_lufs ?? -99);
          break;
        case 'TRUE_PEAK':
          comparison = (a.peaks?.true_peak_dbtp ?? -99) - (b.peaks?.true_peak_dbtp ?? -99);
          break;
        case 'SAMPLE_PEAK':
          comparison = (a.peaks?.sample_peak_dbfs ?? -99) - (b.peaks?.sample_peak_dbfs ?? -99);
          break;
        case 'WARNINGS': {
          const aWarn = a.checks.filter((c) => c.status === 'WARNING').length;
          const bWarn = b.checks.filter((c) => c.status === 'WARNING').length;
          comparison = aWarn - bWarn;
          break;
        }
        case 'FAILURES': {
          const aFail = a.checks.filter((c) => c.status === 'FAIL' || c.status === 'ERROR').length;
          const bFail = b.checks.filter((c) => c.status === 'FAIL' || c.status === 'ERROR').length;
          comparison = aFail - bFail;
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return files;
  }, [batchResult?.files, sortColumn, sortDirection]);

  const renderSortIndicator = (col: MatrixSortColumn) => {
    if (sortColumn !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-cyan-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-400 ml-1 inline" />
    );
  };

  const getStatusBadge = (status: QCStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
            <CheckCircle2 className="w-3 h-3" />
            <span>PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px]">
            <AlertTriangle className="w-3 h-3" />
            <span>WARN</span>
          </span>
        );
      case 'ERROR':
      case 'FAIL':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px]">
            <XCircle className="w-3 h-3" />
            <span>{status === 'ERROR' ? 'ERROR' : 'FAIL'}</span>
          </span>
        );
    }
  };

  if (isGated) {
    return (
      <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10 space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">Batch QC Comparison Matrix</h4>
            <p className="text-xs text-slate-300 max-w-md">
              Batch QC is available on Pro. Upgrade to Pro to analyze multiple files together with full multi-track matrix alignment and outlier detection.
            </p>
          </div>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="py-2.5 px-5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            Unlock QC Matrix on Pro (€4.99/mo)
          </button>
        </div>

        {/* Backdrop preview */}
        <div className="opacity-15 pointer-events-none space-y-2">
          <div className="h-9 bg-slate-800 rounded-lg w-full" />
          <div className="h-9 bg-slate-800 rounded-lg w-full" />
          <div className="h-9 bg-slate-800 rounded-lg w-full" />
          <div className="h-9 bg-slate-800 rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden space-y-2 shadow-xl">
      {/* Matrix Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Batch QC Comparison Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic technical &amp; loudness alignment across {batchResult?.files?.length || 0} tracks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Variation / Outlier</span>
          </span>
          <span>&bull;</span>
          <span className="text-slate-400">Click row or Inspect to expand details</span>
        </div>
      </div>

      {/* 100% Full-Width Matrix Table with safe inner spacing */}
      <div className="w-full px-2 pb-2">
        <table className="w-full text-left text-xs border-collapse table-fixed" aria-label="Batch QC Comparison Matrix">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-mono">
              <th scope="col" className="py-2.5 px-3 w-[26%] sm:w-[24%]">
                <button
                  type="button"
                  onClick={() => handleSort('FILENAME')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none rounded px-0.5"
                >
                  <span>Track &bull; Duration</span>
                  {renderSortIndicator('FILENAME')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-2 w-[12%] sm:w-[10%] text-center">
                <button
                  type="button"
                  onClick={() => handleSort('STATUS')}
                  className="inline-flex items-center hover:text-white transition-colors focus:outline-none rounded px-0.5"
                >
                  <span>Status</span>
                  {renderSortIndicator('STATUS')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-2 w-[18%] sm:w-[17%]">
                <button
                  type="button"
                  onClick={() => handleSort('SAMPLE_RATE')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none rounded px-0.5"
                >
                  <span>Format &bull; Specs</span>
                  {renderSortIndicator('SAMPLE_RATE')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-2 w-[16%] sm:w-[15%]">
                <button
                  type="button"
                  onClick={() => handleSort('LUFS')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none rounded px-0.5"
                >
                  <span>Loudness (LUFS)</span>
                  {renderSortIndicator('LUFS')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-2 w-[14%] sm:w-[13%]">
                <button
                  type="button"
                  onClick={() => handleSort('TRUE_PEAK')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none rounded px-0.5"
                >
                  <span>True Peak &bull; Clip</span>
                  {renderSortIndicator('TRUE_PEAK')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-2 w-[6%] sm:w-[6%] text-center">
                <button
                  type="button"
                  onClick={() => handleSort('WARNINGS')}
                  className="inline-flex items-center hover:text-white transition-colors focus:outline-none rounded px-0.5"
                  title="Warnings / Failures count"
                >
                  <span>Issues</span>
                  {renderSortIndicator('WARNINGS')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-3 w-[12%] sm:w-[15%] text-right pr-4">
                <span>Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedFiles.map((f) => {
              const info = f.file_info;
              const warnCount = f.checks?.filter((c) => c.status === 'WARNING').length || 0;
              const failCount = f.checks?.filter((c) => c.status === 'FAIL' || c.status === 'ERROR').length || 0;

              const isSrDifferent = info && majorityStats.sr && String(info.sample_rate) !== majorityStats.sr;
              const isBdDifferent = info && majorityStats.bd && String(info.bit_depth) !== majorityStats.bd;
              const isFmtDifferent = info && majorityStats.fmt && info.format?.toUpperCase() !== majorityStats.fmt;
              const isLayoutDifferent = info && majorityStats.layout && info.channel_layout !== majorityStats.layout;

              const durationStr = info?.duration_seconds 
                ? `${Math.floor(info.duration_seconds / 60)}:${Math.floor(info.duration_seconds % 60).toString().padStart(2, '0')}`
                : '0:00';

              return (
                <tr
                  key={f.file_id || f.filename}
                  onClick={() => {
                    if (onSelectFileDetail) {
                      onSelectFileDetail(f);
                    } else {
                      setSelectedModalFile(f);
                    }
                  }}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Filename & Duration */}
                  <td className="py-3 px-3 min-w-0">
                    <div className="font-semibold text-slate-200 truncate group-hover:text-cyan-300 text-xs transition-colors">
                      {f.filename}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span>{durationStr}</span>
                      <span>&bull;</span>
                      <span className="text-slate-300">{info?.format || 'WAV'}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    {getStatusBadge(f.overall_status)}
                  </td>

                  {/* Format & Tech Specs */}
                  <td className="py-3 px-2 font-mono text-[11px] min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={isSrDifferent ? 'text-amber-400 font-bold bg-amber-500/10 px-1 py-0.2 rounded' : 'text-slate-200'}>
                        {info ? `${(info.sample_rate / 1000).toFixed(1)}k` : 'N/A'}
                      </span>
                      <span>/</span>
                      <span className={isBdDifferent ? 'text-amber-400 font-bold bg-amber-500/10 px-1 py-0.2 rounded' : 'text-slate-200'}>
                        {info?.bit_depth ? `${info.bit_depth}b` : '16b'}
                      </span>
                      <span>&bull;</span>
                      <span className={isLayoutDifferent ? 'text-amber-400 font-bold bg-amber-500/10 px-1 py-0.2 rounded text-[10px]' : 'text-slate-400 text-[10px]'}>
                        {info?.channel_layout || 'Stereo'}
                      </span>
                    </div>
                  </td>

                  {/* Integrated LUFS & LRA */}
                  <td className="py-3 px-2 font-mono text-xs">
                    <div className="font-bold text-cyan-300">
                      {f.loudness?.integrated_lufs !== null && f.loudness?.integrated_lufs !== undefined
                        ? `${f.loudness.integrated_lufs} LUFS`
                        : 'N/A'}
                    </div>
                    {f.loudness?.loudness_range_lu !== null && f.loudness?.loudness_range_lu !== undefined && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        LRA: {f.loudness.loudness_range_lu} LU
                      </div>
                    )}
                  </td>

                  {/* True Peak & Clipping */}
                  <td className="py-3 px-2 font-mono text-xs">
                    <div className={f.peaks && f.peaks.true_peak_dbtp > -1.0 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                      {f.peaks?.true_peak_dbtp !== null && f.peaks?.true_peak_dbtp !== undefined ? `${f.peaks.true_peak_dbtp} dBTP` : 'N/A'}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {f.clipping?.clipping_detected ? (
                        <span className="text-rose-400 font-bold">Clip: {f.clipping.clipped_samples} smp</span>
                      ) : (
                        <span className="text-emerald-400">Clean</span>
                      )}
                    </div>
                  </td>

                  {/* Warnings / Failures */}
                  <td className="py-3 px-2 text-center font-mono text-xs">
                    {failCount > 0 ? (
                      <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">{failCount}F</span>
                    ) : warnCount > 0 ? (
                      <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">{warnCount}W</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">0</span>
                    )}
                  </td>

                  {/* Inspect Button (Generously Sized & Fully Visible) */}
                  <td className="py-3 px-3 text-right pr-4 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-xs text-cyan-300 hover:text-white font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 shadow-sm transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* File Detail Modal when row is clicked */}
      {selectedModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Track Inspection
                </span>
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {selectedModalFile.filename}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalFile(null)}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                &larr; Return to Batch Matrix
              </button>
            </div>

            <FileResultCard result={selectedModalFile} />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedModalFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
