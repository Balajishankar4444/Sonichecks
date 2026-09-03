'use client';

import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, RotateCcw, Loader2 } from 'lucide-react';
import { BatchQCResult } from '@/types/qc';
import { downloadPdfReport, downloadCsvReport } from '@/lib/api';

interface ExportActionsProps {
  batchResult: BatchQCResult;
  onReset: () => void;
}

export default function ExportActions({ batchResult, onReset }: ExportActionsProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const handlePdfDownload = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadPdfReport(batchResult);
    } catch (err) {
      alert('Failed to download PDF report. Please verify the audio engine is running.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCsvDownload = async () => {
    try {
      setIsDownloadingCsv(true);
      await downloadCsvReport(batchResult);
    } catch (err) {
      alert('Failed to download CSV export. Please verify the audio engine is running.');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* PDF Download */}
        <button
          type="button"
          onClick={handlePdfDownload}
          disabled={isDownloadingPdf}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isDownloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          ) : (
            <FileDown className="w-4 h-4 text-cyan-400" />
          )}
          <span>Download PDF QC Report</span>
        </button>

        {/* CSV Download */}
        <button
          type="button"
          onClick={handleCsvDownload}
          disabled={isDownloadingCsv}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors active:scale-95 disabled:opacity-50"
        >
          {isDownloadingCsv ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          )}
          <span>Export CSV</span>
        </button>
      </div>

      {/* Reset / Check New Batch */}
      <button
        type="button"
        onClick={onReset}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Check More Audio Files</span>
      </button>
    </div>
  );
}
