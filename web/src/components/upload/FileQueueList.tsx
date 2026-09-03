import React from 'react';
import { QCProfile } from '@/types/qc';
import { EngineMode } from '@/lib/api';
import { 
  FileAudio, 
  Trash2, 
  Layers, 
  Sparkles, 
  Cpu, 
  Server, 
  AlertTriangle, 
  X,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface FileQueueListProps {
  files: File[];
  selectedProfile: QCProfile;
  availableProfiles: QCProfile[];
  engineMode: EngineMode;
  onSelectEngineMode: (mode: EngineMode) => void;
  onSelectProfile: (profile: QCProfile) => void;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  onRemoveDuplicates?: () => void;
  duplicateNames?: string[];
  isAnalyzing: boolean;
  MAX_BATCH_SIZE?: number;
  onStartAnalysis?: () => void;
}

export function FileQueueList({
  files,
  selectedProfile,
  availableProfiles,
  engineMode,
  onSelectEngineMode,
  onSelectProfile,
  onRemoveFile,
  onClearAll,
  onRemoveDuplicates,
  duplicateNames = [],
  isAnalyzing,
  MAX_BATCH_SIZE = 50,
  onStartAnalysis
}: FileQueueListProps) {
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const nonWavFiles = files.filter(f => !f.name.toLowerCase().endsWith('.wav'));

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 space-y-4">
      {/* Header Bar */}
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
            className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Engine Selection Bar */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Analysis Engine</span>
            {engineMode === 'LOCAL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero Upload (Private)</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {engineMode === 'LOCAL' 
              ? 'Local Web Worker DSP engine. Audio samples are analyzed directly in your browser with 0 bytes uploaded to any server.'
              : 'Python / FastAPI reference microservice. Server-side DSP analysis for reference validation and complex multi-format transcoding.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelectEngineMode('LOCAL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              engineMode === 'LOCAL'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local Browser (Default)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectEngineMode('SERVER')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              engineMode === 'SERVER'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Python Reference</span>
          </button>
        </div>
      </div>

      {/* Non-WAV Routing Notice */}
      {engineMode === 'LOCAL' && nonWavFiles.length > 0 && (
        <div className="px-3.5 py-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2">
          <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Format Routing Notice:</span> Browser analysis processes uncompressed WAV files locally on your device with 0 upload. Non-WAV formats ({nonWavFiles.map(f => f.name.split('.').pop()?.toUpperCase()).join(', ')}) will be analyzed using the Python Reference Engine.
          </div>
        </div>
      )}

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
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold whitespace-nowrap self-start sm:self-auto transition-colors cursor-pointer"
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
          const isWav = file.name.toLowerCase().endsWith('.wav');
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
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono">{formatBytes(file.size)}</span>
                    <span>&bull;</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {ext}
                    </span>
                    <span>&bull;</span>
                    {isWav ? (
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <span>🔒 Local Browser DSP</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1">
                        <span>🌐 Server Reference</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                disabled={isAnalyzing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0 cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type AnalysisEngineMode = EngineMode;
export default FileQueueList;

