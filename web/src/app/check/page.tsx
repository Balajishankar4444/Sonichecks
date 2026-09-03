'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShieldCheck, AlertCircle, Sparkles, AudioWaveform, RotateCcw } from 'lucide-react';
import AudioDropzone from '@/components/upload/AudioDropzone';
import FileQueueList from '@/components/upload/FileQueueList';
import LoadingSteps, { FileAnalysisStatus } from '@/components/common/LoadingSteps';
import BatchSummaryCard from '@/components/results/BatchSummaryCard';
import ConsistencyAlertBanner from '@/components/results/ConsistencyAlertBanner';
import FileResultCard from '@/components/results/FileResultCard';
import FilterSortBar, { FilterStatus, SortOption } from '@/components/results/FilterSortBar';
import ExportActions from '@/components/results/ExportActions';
import { BatchQCResult, FileQCResult, QCProfile, QCStatus } from '@/types/qc';
import { getQCProfiles, analyzeBatchFiles, analyzeSingleFile } from '@/lib/api';
import { saveBatchToHistory } from '@/lib/storage';
import { MAX_BATCH_SIZE } from '@/config/batch';

export default function CheckPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [profiles, setProfiles] = useState<QCProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<QCProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchQCResult | null>(null);
  const [isPartialCancelled, setIsPartialCancelled] = useState(false);

  // Progress state
  const [completedCount, setCompletedCount] = useState(0);
  const [currentFilename, setCurrentFilename] = useState<string | undefined>(undefined);
  const [fileStatuses, setFileStatuses] = useState<FileAnalysisStatus[]>([]);
  const [retryingFilename, setRetryingFilename] = useState<string | null>(null);

  // Filtering and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [activeSort, setActiveSort] = useState<SortOption>('NAME_ASC');

  // Abort controller ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function loadProfiles() {
      const data = await getQCProfiles();
      setProfiles(data);
      if (data.length > 0) {
        setSelectedProfile(data[0]);
      }
    }
    loadProfiles();
  }, []);

  const handleFilesSelected = (newFiles: File[]) => {
    setErrorMessage(null);
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, MAX_BATCH_SIZE);
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveDuplicates = () => {
    setFiles((prev) => {
      const seenNames = new Set<string>();
      return prev.filter((file) => {
        if (seenNames.has(file.name)) {
          return false;
        }
        seenNames.add(file.name);
        return true;
      });
    });
  };

  const handleClearAll = () => {
    setFiles([]);
    setErrorMessage(null);
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsAnalyzing(false);
      setIsPartialCancelled(true);
    }
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0 || !selectedProfile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsPartialCancelled(false);
    setCompletedCount(0);

    const initialStatuses: FileAnalysisStatus[] = files.map((f) => ({
      filename: f.name,
      status: 'WAITING'
    }));
    setFileStatuses(initialStatuses);

    abortControllerRef.current = new AbortController();

    // Fake ticker to simulate per-file queue steps during active batch upload
    const ticker = setInterval(() => {
      setCompletedCount((prev) => {
        const next = Math.min(files.length - 1, prev + 1);
        if (next < files.length) {
          setCurrentFilename(files[next]?.name);
          setFileStatuses((statuses) =>
            statuses.map((s, idx) => {
              if (idx < next) return { ...s, status: 'DONE' };
              if (idx === next) return { ...s, status: 'ANALYZING' };
              return s;
            })
          );
        }
        return next;
      });
    }, 450);

    try {
      const result = await analyzeBatchFiles(
        files,
        selectedProfile.profile_id,
        abortControllerRef.current.signal
      );
      clearInterval(ticker);
      setCompletedCount(files.length);
      setBatchResult(result);
      saveBatchToHistory(result);
    } catch (err: any) {
      clearInterval(ticker);
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setIsPartialCancelled(true);
        setErrorMessage('Batch analysis was cancelled by the user.');
      } else {
        console.error('Analysis error:', err);
        setErrorMessage(
          err.message || 'Unable to complete batch analysis. Please verify your files and ensure the audio engine is running.'
        );
      }
    } finally {
      clearInterval(ticker);
      setIsAnalyzing(false);
    }
  };

  // Retry single file analysis without re-uploading entire batch
  const handleRetryFile = async (filename: string) => {
    if (!batchResult || !selectedProfile) return;
    const fileObj = files.find((f) => f.name === filename);
    if (!fileObj) {
      alert(`Original file '${filename}' is not available in current staging queue to retry.`);
      return;
    }

    setRetryingFilename(filename);
    try {
      const updatedResult = await analyzeSingleFile(fileObj, selectedProfile.profile_id);
      
      // Update this file in batchResult
      setBatchResult((prev) => {
        if (!prev) return null;
        const newFiles = prev.files.map((f) => (f.filename === filename ? updatedResult : f));
        const passed = newFiles.filter((f) => f.overall_status === 'PASS').length;
        const warnings = newFiles.filter((f) => f.overall_status === 'WARNING').length;
        const failed = newFiles.filter((f) => f.overall_status === 'FAIL').length;
        const errors = newFiles.filter((f) => f.overall_status === 'ERROR').length;

        const overall = failed > 0 || errors > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS';

        return {
          ...prev,
          files: newFiles,
          summary: {
            ...prev.summary,
            passed,
            warnings,
            failed,
            errors
          },
          overall_status: overall
        };
      });
    } catch (e: any) {
      alert(`Retry failed for ${filename}: ${e.message}`);
    } finally {
      setRetryingFilename(null);
    }
  };

  const handleReset = () => {
    setBatchResult(null);
    setFiles([]);
    setErrorMessage(null);
    setIsPartialCancelled(false);
    setCompletedCount(0);
    setFileStatuses([]);
  };

  // Demo Batch Loader
  const loadDemoBatch = (count: number = 4) => {
    const createWavBlob = (generator: (i: number) => number, sampleRate: number): File => {
      const numSamples = sampleRate * 2;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);
      
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);
      
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.max(-1, Math.min(1, generator(i)));
        view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return new File([blob], 'track.wav', { type: 'audio/wav' });
    };

    const demoTracks: File[] = [];

    // Track 1: Clean Master 48k (PASS)
    const t1 = createWavBlob((i) => 0.18 * Math.sin((2 * Math.PI * 440 * i) / 48000), 48000);
    demoTracks.push(new File([t1], '01_Intro_Theme_Master_48k.wav', { type: 'audio/wav' }));

    // Track 2: Overloaded Clipped 44.1k (FAIL)
    const t2 = createWavBlob((i) => Math.max(-0.9999, Math.min(0.9999, 1.8 * Math.sin((2 * Math.PI * 220 * i) / 44100))), 44100);
    demoTracks.push(new File([t2], '02_Lead_Vocal_Hot_44k.wav', { type: 'audio/wav' }));

    // Track 3: Excessive Silence (WARNING)
    const t3 = createWavBlob((i) => (i < 48000 * 0.8 ? 0 : 0.15 * Math.sin((2 * Math.PI * 523 * i) / 48000)), 48000);
    demoTracks.push(new File([t3], '03_Podcast_Interview_LeadSilence.wav', { type: 'audio/wav' }));

    // Track 4: Clean Instrumental 48k (PASS)
    const t4 = createWavBlob((i) => 0.16 * Math.sin((2 * Math.PI * 880 * i) / 48000), 48000);
    demoTracks.push(new File([t4], '04_Outro_Acoustic_48k.wav', { type: 'audio/wav' }));

    setFiles(demoTracks);
  };

  // Filtered & Sorted File Results
  const filteredAndSortedFiles = useMemo(() => {
    if (!batchResult) return [];

    let list = [...batchResult.files];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.filename.toLowerCase().includes(q));
    }

    // 2. Status Filter
    if (activeFilter !== 'ALL') {
      list = list.filter((f) => f.overall_status === activeFilter);
    }

    // 3. Sorting
    list.sort((a, b) => {
      switch (activeSort) {
        case 'NAME_ASC':
          return a.filename.localeCompare(b.filename);
        case 'STATUS_ISSUES': {
          const score = (s: QCStatus) => (s === 'ERROR' || s === 'FAIL' ? 3 : s === 'WARNING' ? 2 : 1);
          return score(b.overall_status) - score(a.overall_status);
        }
        case 'DURATION_DESC':
          return (b.file_info?.duration_seconds ?? 0) - (a.file_info?.duration_seconds ?? 0);
        case 'LUFS_DESC':
          return (b.loudness?.integrated_lufs ?? -99) - (a.loudness?.integrated_lufs ?? -99);
        case 'PEAK_DESC':
          return (b.peaks?.true_peak_dbtp ?? -99) - (a.peaks?.true_peak_dbtp ?? -99);
        default:
          return 0;
      }
    });

    return list;
  }, [batchResult, searchQuery, activeFilter, activeSort]);

  const counts = useMemo(() => {
    if (!batchResult) return { all: 0, passed: 0, warnings: 0, failed: 0, errors: 0 };
    return {
      all: batchResult.files.length,
      passed: batchResult.files.filter((f) => f.overall_status === 'PASS').length,
      warnings: batchResult.files.filter((f) => f.overall_status === 'WARNING').length,
      failed: batchResult.files.filter((f) => f.overall_status === 'FAIL').length,
      errors: batchResult.files.filter((f) => f.overall_status === 'ERROR').length,
    };
  }, [batchResult]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <AudioWaveform className="w-3.5 h-3.5" />
            <span>Sonichecks V1.1 &bull; Multi-File Batch QC Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Batch Audio Quality Control Workspace
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Drop up to {MAX_BATCH_SIZE} audio files. Analyze entire albums or delivery folders concurrently with real deterministic signal processing.
          </p>
        </div>

        {/* Demo Quick Load Banner */}
        {files.length === 0 && !batchResult && !isAnalyzing && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Want to test immediately with a multi-track sample batch?</span>
            </div>
            <button
              type="button"
              onClick={() => loadDemoBatch(4)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold transition-colors"
            >
              Load 4 Demo Tracks
            </button>
          </div>
        )}

        {/* Error / Notice Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Batch Notice</p>
              <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* State 1: Loading State with Real Progress */}
        {isAnalyzing && (
          <div className="py-6">
            <LoadingSteps
              totalFiles={files.length}
              completedCount={completedCount}
              currentFilename={currentFilename}
              fileStatuses={fileStatuses}
              onCancel={handleCancelAnalysis}
            />
          </div>
        )}

        {/* State 2: Results View */}
        {!isAnalyzing && batchResult && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Actions */}
            <ExportActions batchResult={batchResult} onReset={handleReset} />

            {/* Batch Summary */}
            <BatchSummaryCard batchResult={batchResult} isPartial={isPartialCancelled} />

            {/* Consistency Warning Banner */}
            <ConsistencyAlertBanner issues={batchResult.consistency_issues} />

            {/* Filter & Search Toolbar */}
            <FilterSortBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              activeSort={activeSort}
              onSortChange={setActiveSort}
              counts={counts}
            />

            {/* Per-Track Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Showing {filteredAndSortedFiles.length} of {batchResult.files.length} files</span>
              </div>

              {filteredAndSortedFiles.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
                  No audio files matched the current filter or search criteria.
                </div>
              ) : (
                filteredAndSortedFiles.map((fileRes) => (
                  <FileResultCard
                    key={fileRes.file_id || fileRes.filename}
                    result={fileRes}
                    onRetry={handleRetryFile}
                    isRetrying={retryingFilename === fileRes.filename}
                  />
                ))
              )}
            </div>

            {/* Bottom Export Toolbar */}
            <ExportActions batchResult={batchResult} onReset={handleReset} />
          </div>
        )}

        {/* State 3: Upload & Staged Queue View */}
        {!isAnalyzing && !batchResult && (
          <div className="space-y-6">
            <AudioDropzone
              onFilesSelected={handleFilesSelected}
              disabled={isAnalyzing}
              currentCount={files.length}
            />

            {selectedProfile && profiles.length > 0 && (
              <FileQueueList
                files={files}
                onRemoveFile={handleRemoveFile}
                onRemoveDuplicates={handleRemoveDuplicates}
                onClearAll={handleClearAll}
                onStartAnalysis={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                selectedProfile={selectedProfile}
                availableProfiles={profiles}
                onSelectProfile={setSelectedProfile}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
