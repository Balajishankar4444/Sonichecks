'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lock, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronRight, 
  ExternalLink,
  Volume2,
  Info,
  Sparkles,
  Eye
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
    const valid = batchResult.files.filter((f) => f.file_info !== null);
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
      sr: getMode(valid.map((f) => f.file_info!.sample_rate)),
      bd: getMode(valid.map((f) => f.file_info!.bit_depth)),
      fmt: getMode(valid.map((f) => f.file_info!.format?.toUpperCase())),
      layout: getMode(valid.map((f) => f.file_info!.channel_layout))
    };
  }, [batchResult.files]);

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
    const files = [...batchResult.files];

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
  }, [batchResult.files, sortColumn, sortDirection]);

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
          <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            <span>PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
            <AlertTriangle className="w-3 h-3" />
            <span>WARN</span>
          </span>
        );
      case 'ERROR':
      case 'FAIL':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[11px]">
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
    <div className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden space-y-3 shadow-xl">
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
              Deterministic technical &amp; loudness alignment across {batchResult.files.length} tracks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Variation / Outlier</span>
          </span>
          <span>&bull;</span>
          <span className="text-slate-400">Click any row to view full file details</span>
        </div>
      </div>

      {/* Desktop / Tablet Scrollable Matrix Table */}
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <table className="w-full text-left text-xs border-collapse min-w-[1050px]" aria-label="Batch QC Comparison Matrix">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('FILENAME')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>Filename</span>
                  {renderSortIndicator('FILENAME')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('STATUS')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>Status</span>
                  {renderSortIndicator('STATUS')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3">Format</th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('SAMPLE_RATE')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>Sample Rate</span>
                  {renderSortIndicator('SAMPLE_RATE')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('BIT_DEPTH')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>Bit Depth</span>
                  {renderSortIndicator('BIT_DEPTH')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3">Channels</th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('DURATION')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>Duration</span>
                  {renderSortIndicator('DURATION')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('LUFS')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>Int. LUFS</span>
                  {renderSortIndicator('LUFS')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3">Short-Term</th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('TRUE_PEAK')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>True Peak</span>
                  {renderSortIndicator('TRUE_PEAK')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3">Clipping</th>
              <th scope="col" className="py-3 px-3">Silence</th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('WARNINGS')}
                  className="flex items-center hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
                >
                  <span>Warn/Fail</span>
                  {renderSortIndicator('WARNINGS')}
                </button>
              </th>
              <th scope="col" className="py-3 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedFiles.map((f) => {
              const info = f.file_info;
              const warnCount = f.checks.filter((c) => c.status === 'WARNING').length;
              const failCount = f.checks.filter((c) => c.status === 'FAIL' || c.status === 'ERROR').length;

              const isSrDifferent = info && majorityStats.sr && String(info.sample_rate) !== majorityStats.sr;
              const isBdDifferent = info && majorityStats.bd && String(info.bit_depth) !== majorityStats.bd;
              const isFmtDifferent = info && majorityStats.fmt && info.format.toUpperCase() !== majorityStats.fmt;
              const isLayoutDifferent = info && majorityStats.layout && info.channel_layout !== majorityStats.layout;

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
                  {/* Filename */}
                  <td className="py-3.5 px-4 font-medium text-slate-200 truncate max-w-[200px] group-hover:text-cyan-300">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{f.filename}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getStatusBadge(f.overall_status)}
                  </td>

                  {/* Format */}
                  <td className="py-3.5 px-3 font-mono">
                    <span className={isFmtDifferent ? 'text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded' : 'text-slate-300'}>
                      {info?.format || 'N/A'}
                    </span>
                  </td>

                  {/* Sample Rate */}
                  <td className="py-3.5 px-3 font-mono">
                    {info ? (
                      <span className={isSrDifferent ? 'text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded' : 'text-slate-300'}>
                        {info.sample_rate / 1000} kHz
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>

                  {/* Bit Depth */}
                  <td className="py-3.5 px-3 font-mono">
                    {info?.bit_depth ? (
                      <span className={isBdDifferent ? 'text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded' : 'text-slate-300'}>
                        {info.bit_depth}-bit
                      </span>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </td>

                  {/* Channels */}
                  <td className="py-3.5 px-3 font-mono text-slate-300">
                    <span className={isLayoutDifferent ? 'text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded' : ''}>
                      {info?.channel_layout || 'N/A'}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-3 font-mono text-slate-300">
                    {info ? `${info.duration_seconds}s` : 'N/A'}
                  </td>

                  {/* Integrated LUFS */}
                  <td className="py-3.5 px-3 font-mono font-bold text-cyan-300">
                    {f.loudness?.integrated_lufs !== null && f.loudness?.integrated_lufs !== undefined
                      ? `${f.loudness.integrated_lufs} LUFS`
                      : 'N/A'}
                  </td>

                  {/* Short-term LUFS */}
                  <td className="py-3.5 px-3 font-mono text-slate-400">
                    {f.loudness?.short_term_max_lufs !== null && f.loudness?.short_term_max_lufs !== undefined
                      ? `${f.loudness.short_term_max_lufs}`
                      : 'N/A'}
                  </td>

                  {/* True Peak */}
                  <td className="py-3.5 px-3 font-mono">
                    {f.peaks ? (
                      <span className={f.peaks.true_peak_dbtp > -1.0 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                        {f.peaks.true_peak_dbtp} dBTP
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>

                  {/* Clipping */}
                  <td className="py-3.5 px-3 font-mono">
                    {f.clipping?.clipping_detected ? (
                      <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                        {f.clipping.clipped_samples} smp
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">None</span>
                    )}
                  </td>

                  {/* Silence */}
                  <td className="py-3.5 px-3 font-mono text-slate-400">
                    {f.silence ? `${f.silence.leading_silence_sec}s / ${f.silence.trailing_silence_sec}s` : 'N/A'}
                  </td>

                  {/* Warnings / Failures Count */}
                  <td className="py-3.5 px-3 font-mono">
                    <div className="flex items-center gap-1.5">
                      {warnCount > 0 && <span className="text-amber-400 font-bold">{warnCount}W</span>}
                      {failCount > 0 && <span className="text-rose-400 font-bold">{failCount}F</span>}
                      {warnCount === 0 && failCount === 0 && <span className="text-emerald-400">0</span>}
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 opacity-80 group-hover:opacity-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
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
