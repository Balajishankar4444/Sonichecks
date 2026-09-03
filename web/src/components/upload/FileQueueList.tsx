'use client';

import React from 'react';
import { FileAudio, Trash2, ShieldCheck, Sparkles, X, Layers, AlertTriangle } from 'lucide-react';
import { QCProfile } from '@/types/qc';
import { MAX_BATCH_SIZE } from '@/config/batch';

interface FileQueueListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  onRemoveDuplicates: () => void;
  onClearAll: () => void;
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
  selectedProfile: QCProfile;
  availableProfiles: QCProfile[];
  onSelectProfile: (profile: QCProfile) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FileQueueList({
  files,
  onRemoveFile,
  onRemoveDuplicates,
  onClearAll,
  onStartAnalysis,
  isAnalyzing,
  selectedProfile,
  availableProfiles,
  onSelectProfile
}: FileQueueListProps) {
  if (files.length === 0) return null;

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  // Check for duplicate filenames or identical (name+size)
  const nameCounts: Record<string, number> = {};
  files.forEach(f => {
    nameCounts[f.name] = (nameCounts[f.name] || 0) + 1;
  });
  const duplicateNames = Object.keys(nameCounts).filter(name => nameCounts[name] > 1);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header with counts and profile selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h4 className="font-semibold text-white flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Staged Audio Files ({files.length} / {MAX_BATCH_SIZE})</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Total size: {formatBytes(totalSize)}
          </p>
        </div>

        {/* Profile Selector & Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium text-slate-400">Profile:</label>
          <select
            value={selectedProfile.profile_id}
            onChange={(e) => {
              const p = availableProfiles.find(item => item.profile_id === e.target.value);
              if (p) onSelectProfile(p);
            }}
            disabled={isAnalyzing}
            className="text-xs font-medium bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            {availableProfiles.map((p) => (
              <option key={p.profile_id} value={p.profile_id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClearAll}
            disabled={isAnalyzing}
            className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors ml-1"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateNames.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold">Duplicate file(s) detected: </span>
              <span>{duplicateNames.slice(0, 3).join(', ')}{duplicateNames.length > 3 ? ` (+${duplicateNames.length - 3} more)` : ''} appears multiple times in the batch.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveDuplicates}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold whitespace-nowrap self-start sm:self-auto transition-colors"
          >
            Remove Duplicates
          </button>
        </div>
      )}

      {/* Profile Description Notice */}
      <div className="px-3.5 py-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">{selectedProfile.name}:</span> {selectedProfile.description}
        </div>
      </div>

      {/* File Items Grid / List */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {files.map((file, idx) => {
          const ext = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
          const isDuplicate = duplicateNames.includes(file.name);

          return (
            <div
              key={`${file.name}-${idx}-${file.size}`}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors group ${
                isDuplicate 
                  ? 'bg-amber-950/20 border-amber-500/30' 
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDuplicate ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-cyan-400'
                }`}>
                  <FileAudio className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                      {file.name}
                    </p>
                    {isDuplicate && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Duplicate
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono">{formatBytes(file.size)}</span>
                    <span>&bull;</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ext}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                disabled={isAnalyzing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Dynamic Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStartAnalysis}
          disabled={isAnalyzing || files.length === 0}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          <span>
            {files.length === 1 ? 'Analyze 1 File' : `Analyze ${files.length} Files`}
          </span>
        </button>
      </div>
    </div>
  );
}
