'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowUpDown, 
  Filter, 
  FileText, 
  Download, 
  Search,
  Eye,
  FileCode2,
  Lock,
  Layers
} from 'lucide-react';
import { BatchQCResult, FileQCResult, QCStatus } from '@/types/qc';
import { downloadPdfCertificate } from '@/lib/reports/pdf-export';
import { downloadCsvLocally } from '@/lib/reports/csv-export';
import { exportQcResultAsJson } from '@/lib/reports/json-export';
import { ProductTier } from '@/config/tiers';

interface BatchComparisonMatrixProps {
  batchResult: BatchQCResult;
  onSelectFile?: (file: FileQCResult) => void;
  selectedFileId?: string;
  userTier?: ProductTier;
  onGatedAction?: (featureName: string, description: string, requiredTier: ProductTier) => void;
}

type SortField = 'name' | 'status' | 'lufs' | 'true_peak' | 'clipping' | 'duration';
type SortOrder = 'asc' | 'desc';

export default function BatchComparisonMatrix({
  batchResult,
  onSelectFile,
  selectedFileId,
  userTier = 'PRO',
  onGatedAction
}: BatchComparisonMatrixProps) {
  const isStudio = userTier === 'STUDIO';
  const [showOnlyFailures, setShowOnlyFailures] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedFiles = useMemo(() => {
    let list = [...batchResult.files];

    // Filter by failure / warning
    if (showOnlyFailures) {
      list = list.filter(f => f.overall_status === 'FAIL' || f.overall_status === 'WARNING');
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(f => f.filename.toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'status': {
          const score = (s: QCStatus) => s === 'FAIL' ? 3 : s === 'WARNING' ? 2 : 1;
          comparison = score(b.overall_status) - score(a.overall_status);
          break;
        }
        case 'lufs': {
          const lufsA = a.loudness?.integrated_lufs ?? -99;
          const lufsB = b.loudness?.integrated_lufs ?? -99;
          comparison = lufsB - lufsA;
          break;
        }
        case 'true_peak': {
          const tpA = a.peaks?.true_peak_dbtp ?? -99;
          const tpB = b.peaks?.true_peak_dbtp ?? -99;
          comparison = tpB - tpA;
          break;
        }
        case 'clipping': {
          const clipA = a.clipping?.clipped_samples ?? 0;
          const clipB = b.clipping?.clipped_samples ?? 0;
          comparison = clipB - clipA;
          break;
        }
        case 'duration': {
          const durA = a.file_info?.duration_seconds ?? 0;
          const durB = b.file_info?.duration_seconds ?? 0;
          comparison = durB - durA;
          break;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [batchResult.files, showOnlyFailures, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const passCount = batchResult.files.filter(f => f.overall_status === 'PASS').length;
  const warnCount = batchResult.files.filter(f => f.overall_status === 'WARNING').length;
  const failCount = batchResult.files.filter(f => f.overall_status === 'FAIL').length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      {/* Batch Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Batch Delivery Comparison Matrix
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({batchResult.files.length} tracks &bull; {batchResult.profile_name})
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <strong>{passCount}</strong> Passed
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <strong>{warnCount}</strong> Warnings
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
              <strong>{failCount}</strong> Failed
            </span>
          </div>
        </div>

        {/* Bulk Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadPdfCertificate(batchResult)}
            className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Batch PDF Certificate</span>
          </button>

          <button
            type="button"
            onClick={() => downloadCsvLocally(batchResult)}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isStudio && onGatedAction) {
                onGatedAction(
                  'Machine-Readable JSON Export',
                  'Export full batch QC metrics as structured JSON for automation pipelines on the Studio plan.',
                  'STUDIO'
                );
                return;
              }
              exportQcResultAsJson(batchResult);
            }}
            className={`px-3 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isStudio 
                ? 'border-purple-800/60 bg-purple-950/40 text-purple-300 hover:bg-purple-950/70' 
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {isStudio ? <FileCode2 className="w-3.5 h-3.5 text-purple-400" /> : <Lock className="w-3.5 h-3.5 text-purple-400" />}
            <span>{isStudio ? 'JSON' : 'JSON (Studio)'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search track names..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnlyFailures(!showOnlyFailures)}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showOnlyFailures 
                ? 'border-rose-500/60 bg-rose-950/30 text-rose-300' 
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Show Only Failures / Warnings</span>
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('name')}>
                <span className="flex items-center gap-1">Track Name <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="p-3 text-center cursor-pointer select-none" onClick={() => handleSort('status')}>
                <span className="flex items-center justify-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort('lufs')}>
                <span className="flex items-center justify-end gap-1">LUFS <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort('true_peak')}>
                <span className="flex items-center justify-end gap-1">True Peak <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="p-3 text-center cursor-pointer select-none" onClick={() => handleSort('clipping')}>
                <span className="flex items-center justify-center gap-1">Clipping <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="p-3 text-center">Format / Rate</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
            {filteredAndSortedFiles.map((file, idx) => {
              const isSelected = selectedFileId === file.file_id;
              const isFail = file.overall_status === 'FAIL';
              const isWarn = file.overall_status === 'WARNING';
              const statusBadge = isFail 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                : isWarn 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

              return (
                <tr 
                  key={file.file_id || idx}
                  className={`transition-colors hover:bg-slate-800/50 ${
                    isSelected ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-white max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                      <span className="truncate">{file.filename}</span>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                      {file.overall_status}
                    </span>
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-slate-200">
                    {file.loudness?.integrated_lufs !== null && file.loudness?.integrated_lufs !== undefined 
                      ? `${file.loudness.integrated_lufs} LUFS` 
                      : 'N/A'}
                  </td>

                  <td className={`p-3 text-right font-mono font-bold ${
                    (file.peaks?.true_peak_dbtp ?? -99) > -1.0 ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {file.peaks?.true_peak_dbtp !== null && file.peaks?.true_peak_dbtp !== undefined 
                      ? `${file.peaks.true_peak_dbtp} dBTP` 
                      : 'N/A'}
                  </td>

                  <td className="p-3 text-center font-mono">
                    {file.clipping?.clipping_detected ? (
                      <span className="text-rose-400 font-bold">{file.clipping.clipped_samples} smp</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">0</span>
                    )}
                  </td>

                  <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                    {file.file_info?.sample_rate ? `${file.file_info.sample_rate / 1000}k` : '48k'} / {file.file_info?.bit_depth || 24}b
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {onSelectFile && (
                        <button
                          type="button"
                          onClick={() => onSelectFile(file)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => downloadPdfCertificate(file)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Export Individual Certificate"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
