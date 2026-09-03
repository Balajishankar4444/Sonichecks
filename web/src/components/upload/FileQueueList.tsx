'use client';

import React from 'react';
import { FileAudio, Trash2, ShieldCheck, Sparkles, X, Layers } from 'lucide-react';
import { QCProfile } from '@/types/qc';

interface FileQueueListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
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
  onClearAll,
  onStartAnalysis,
  isAnalyzing,
  selectedProfile,
  availableProfiles,
  onSelectProfile
}: FileQueueListProps) {
  if (files.length === 0) return null;

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header with counts and profile selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h4 className="font-semibold text-white flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Staged Audio Files ({files.length})</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Total size: {formatBytes(totalSize)}
          </p>
        </div>

        {/* Profile Selector */}
        <div className="flex items-center gap-2">
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
          return (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                    {file.name}
                  </p>
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

      {/* Big Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStartAnalysis}
          disabled={isAnalyzing || files.length === 0}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          <span>
            {files.length === 1 ? 'Analyze Audio File' : `Analyze ${files.length} Audio Files`}
          </span>
        </button>
      </div>
    </div>
  );
}
