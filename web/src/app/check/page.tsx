'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  AudioWaveform, 
  RotateCcw, 
  Lock, 
  ArrowRight, 
  Layers, 
  Table, 
  LayoutGrid, 
  ListOrdered,
  Cpu
} from 'lucide-react';
import AudioDropzone from '@/components/upload/AudioDropzone';
import FileQueueList, { AnalysisEngineMode } from '@/components/upload/FileQueueList';
import LoadingSteps, { FileAnalysisStatus } from '@/components/common/LoadingSteps';
import BatchSummaryCard from '@/components/results/BatchSummaryCard';
import ConsistencyAlertBanner from '@/components/results/ConsistencyAlertBanner';
import FileResultCard from '@/components/results/FileResultCard';
import FilterSortBar, { FilterStatus, SortOption } from '@/components/results/FilterSortBar';
import ExportActions from '@/components/results/ExportActions';
import BatchComparisonMatrix from '@/components/results/BatchComparisonMatrix';
import UpgradePromptModal, { UpgradePromptState } from '@/components/common/UpgradePromptModal';
import TierBadgeSelector from '@/components/common/TierBadgeSelector';
import { BatchQCResult, FileQCResult, QCProfile, QCStatus } from '@/types/qc';
import { getQCProfiles, DEFAULT_QC_PROFILES, analyzeBatchFiles, analyzeSingleFile } from '@/lib/api';
import { saveBatchToHistory, getUsageState, updatePlan, UsageState } from '@/lib/storage';
import { ProductTier, TIER_CONFIGS, getTierConfig } from '@/config/tiers';
import { useAuth } from '@/context/AuthContext';
import { analyzeAudioFileLocally } from '@/lib/audio-engine/client';
import { convertLocalMeasurementsToFileQCResult } from '@/lib/audio-engine/adapter';

export default function CheckPage() {
  const { user, openAuthModal } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [profiles, setProfiles] = useState<QCProfile[]>(DEFAULT_QC_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<QCProfile>(DEFAULT_QC_PROFILES[0]);
  const [engineMode, setEngineMode] = useState<AnalysisEngineMode>('LOCAL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchQCResult | null>(null);
  const [isPartialCancelled, setIsPartialCancelled] = useState(false);

  // User Tier and Usage State (linked to user email)
  const [usage, setUsage] = useState<UsageState | null>(null);
  const userTier: ProductTier = (usage?.plan?.toUpperCase() as ProductTier) || 'FREE';
  const tierConfig = getTierConfig(userTier);

  // Feature Gate Prompt Modal
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null);

  // Progress state
  const [completedCount, setCompletedCount] = useState(0);
  const [currentFilename, setCurrentFilename] = useState<string | undefined>(undefined);
  const [fileStatuses, setFileStatuses] = useState<FileAnalysisStatus[]>([]);
  const [retryingFilename, setRetryingFilename] = useState<string | null>(null);

  // Filtering, Technical Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [activeSort, setActiveSort] = useState<SortOption>('NAME_ASC');
  const [formatFilter, setFormatFilter] = useState<string>('ALL');
  const [sampleRateFilter, setSampleRateFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'MATRIX' | 'CARDS'>('MATRIX');
  const [selectedInspectFile, setSelectedInspectFile] = useState<FileQCResult | null>(null);

  // Abort controller ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setUsage(getUsageState(user?.email || undefined));
    // Check URL parameters for Creem payment return
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const planParam = urlParams.get('plan')?.toLowerCase();

      if (paymentStatus === 'success' && (planParam === 'pro' || planParam === 'studio')) {
        updatePlan(planParam as 'pro' | 'studio', user?.email || undefined);
        setUsage(getUsageState(user?.email || undefined));
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    const handlePlanUpdate = () => {
      setUsage(getUsageState(user?.email || undefined));
    };
    window.addEventListener('sonichecks_plan_updated', handlePlanUpdate);
    window.addEventListener('storage', handlePlanUpdate);

    async function loadProfiles() {
      const data = await getQCProfiles();
      setProfiles(data);
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const profileParam = urlParams.get('profile')?.toLowerCase();
        if (profileParam) {
          const matched = data.find(p => p.profile_id.toLowerCase() === profileParam);
          if (matched) {
            setSelectedProfile(matched);
            return;
          }
        }
      }
      if (data.length > 0) {
        setSelectedProfile(data[0]);
      }
    }
    loadProfiles();

    return () => {
      window.removeEventListener('sonichecks_plan_updated', handlePlanUpdate);
      window.removeEventListener('storage', handlePlanUpdate);
    };
  }, [user]);

  const triggerGate = (featureName: string, description: string, requiredTier: ProductTier = 'PRO') => {
    setUpgradePrompt({
      isOpen: true,
      featureName,
      description,
      requiredTier
    });
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setErrorMessage(null);

    // Free Tier restriction: Single-file only
    if (userTier === 'FREE' && (newFiles.length > 1 || files.length >= 1)) {
      triggerGate(
        'Multi-File Batch QC',
        'Batch QC is available on Pro. Upgrade to Pro to analyze up to 50 files at once.',
        'PRO'
      );
      setFiles(newFiles.slice(0, 1));
      return;
    }

    // Check tier batch limit
    const maxLimit = tierConfig.maxBatchSize;
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > maxLimit) {
        if (userTier === 'PRO') {
          triggerGate(
            'High-Capacity Batch QC (200 Files)',
            `Pro plan supports up to 50 files per batch. Upgrade to Studio to analyze up to 200 files at once.`,
            'STUDIO'
          );
        }
        return combined.slice(0, maxLimit);
      }
      return combined;
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

    // Login requirement: prompt to login if not authenticated
    if (!user) {
      openAuthModal(() => {
        setTimeout(() => {
          handleStartAnalysis();
        }, 150);
      });
      return;
    }

    // Check monthly allowance limit
    if (usage && usage.filesChecked + files.length > tierConfig.monthlyFileLimit) {
      triggerGate(
        'Monthly QC Allowance Exceeded',
        `You have used ${usage.filesChecked} of your ${tierConfig.monthlyFileLimit} monthly checks on the ${tierConfig.name} plan. Upgrade to unlock higher file allowances.`,
        userTier === 'FREE' ? 'PRO' : 'STUDIO'
      );
      return;
    }

    // Free tier single-file constraint enforcement
    if (userTier === 'FREE' && files.length > 1) {
      triggerGate(
        'Batch Processing Restricted',
        'Free tier is restricted to single-file analysis. Upgrade to Pro to process multi-track batches.',
        'PRO'
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsPartialCancelled(false);
    setCompletedCount(0);
    setSelectedInspectFile(null);

    const initialStatuses: FileAnalysisStatus[] = files.map((f) => ({
      filename: f.name,
      status: 'WAITING'
    }));
    setFileStatuses(initialStatuses);

    abortControllerRef.current = new AbortController();

    try {
      if (engineMode === 'LOCAL') {
        // === LOCAL BROWSER DSP ENGINE (WEB WORKER) ===
        const localFileResults: FileQCResult[] = [];

        for (let i = 0; i < files.length; i++) {
          if (abortControllerRef.current.signal.aborted) {
            throw new Error('Analysis aborted by user.');
          }

          const file = files[i];
          setCurrentFilename(file.name);
          setFileStatuses((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'ANALYZING' } : s))
          );

          let fileQcResult: FileQCResult;
          try {
            // Pure in-browser universal DSP analysis (WAV, MP3, FLAC, AAC, M4A, OGG, AIFF) - 0 upload
            const measurements = await analyzeAudioFileLocally(file);
            fileQcResult = convertLocalMeasurementsToFileQCResult(measurements, selectedProfile);
          } catch (audioErr: any) {
            fileQcResult = {
              file_id: `err_${Date.now()}_${i}`,
              filename: file.name,
              overall_status: 'ERROR',
              checks: [],
              fix_summary: ['Ensure the file is not corrupted and is a standard audio container (WAV, MP3, FLAC, AAC, M4A, OGG, AIFF)'],
              error_message: audioErr.message || 'Failed to decode audio in browser'
            };
          }

          localFileResults.push(fileQcResult);

          setCompletedCount(i + 1);
          setFileStatuses((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'DONE', qcResultStatus: fileQcResult.overall_status } : s))
          );
        }

        const passed = localFileResults.filter((f) => f.overall_status === 'PASS').length;
        const warnings = localFileResults.filter((f) => f.overall_status === 'WARNING').length;
        const failed = localFileResults.filter((f) => f.overall_status === 'FAIL').length;
        const errors = localFileResults.filter((f) => f.overall_status === 'ERROR').length;
        const overall = failed > 0 || errors > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS';

        const validLufs = localFileResults
          .map(f => f.loudness?.integrated_lufs)
          .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > -70.0);
        const avgLufs = validLufs.length > 0 
          ? Math.round((validLufs.reduce((a, b) => a + b, 0) / validLufs.length) * 10) / 10 
          : null;

        const validTruePeaks = localFileResults
          .map(f => f.peaks?.true_peak_dbtp ?? f.peaks?.sample_peak_dbfs)
          .filter((v): v is number => typeof v === 'number' && !isNaN(v));
        const maxTruePeak = validTruePeaks.length > 0 ? Math.max(...validTruePeaks) : null;

        const syntheticBatch: BatchQCResult = {
          batch_id: `batch_local_${Date.now()}`,
          created_at: new Date().toISOString(),
          profile_id: selectedProfile.profile_id,
          profile_name: selectedProfile.name,
          files: localFileResults,
          consistency_issues: [],
          summary: {
            total_files: localFileResults.length,
            passed,
            warnings,
            failed,
            errors,
            avg_lufs: avgLufs,
            highest_true_peak_dbtp: maxTruePeak,
            total_duration_seconds: localFileResults.reduce((acc, f) => acc + (f.file_info?.duration_seconds ?? 0), 0),
            batch_health: overall === 'FAIL' ? 'CRITICAL_ISSUES' : overall === 'WARNING' ? 'NEEDS_ATTENTION' : 'HEALTHY',
            batch_health_reasons: []
          },
          overall_status: overall
        };

        setBatchResult(syntheticBatch);
        saveBatchToHistory(syntheticBatch, user?.email || undefined);
        setUsage(getUsageState(user?.email || undefined));
      } else {
        // === SERVER PYTHON / FASTAPI REFERENCE ENGINE ===
        try {
          if (files.length === 1) {
            setCurrentFilename(files[0].name);
            setFileStatuses([{ filename: files[0].name, status: 'ANALYZING' }]);
            
            const singleResult = await analyzeSingleFile(
              files[0],
              selectedProfile.profile_id,
              abortControllerRef.current.signal,
              userTier
            );

            const syntheticBatch: BatchQCResult = {
              batch_id: singleResult.file_id,
              created_at: new Date().toISOString(),
              profile_id: selectedProfile.profile_id,
              profile_name: selectedProfile.name,
              files: [singleResult],
              consistency_issues: [],
              summary: {
                total_files: 1,
                passed: singleResult.overall_status === 'PASS' ? 1 : 0,
                warnings: singleResult.overall_status === 'WARNING' ? 1 : 0,
                failed: singleResult.overall_status === 'FAIL' ? 1 : 0,
                errors: singleResult.overall_status === 'ERROR' ? 1 : 0,
                avg_lufs: singleResult.loudness?.integrated_lufs ?? null,
                highest_true_peak_dbtp: singleResult.peaks?.true_peak_dbtp ?? null,
                total_duration_seconds: singleResult.file_info?.duration_seconds ?? 0,
                batch_health: singleResult.overall_status === 'FAIL' ? 'CRITICAL_ISSUES' : singleResult.overall_status === 'WARNING' ? 'NEEDS_ATTENTION' : 'HEALTHY',
                batch_health_reasons: []
              },
              overall_status: singleResult.overall_status
            };

            setCompletedCount(1);
            setFileStatuses([{ filename: files[0].name, status: 'DONE', qcResultStatus: singleResult.overall_status }]);
            setBatchResult(syntheticBatch);
            saveBatchToHistory(syntheticBatch, user?.email || undefined);
            setUsage(getUsageState(user?.email || undefined));
          } else {
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
            }, 400);

            const result = await analyzeBatchFiles(
              files,
              selectedProfile.profile_id,
              abortControllerRef.current.signal,
              userTier
            );
            clearInterval(ticker);

            setCompletedCount(files.length);
            setBatchResult(result);
            saveBatchToHistory(result, user?.email || undefined);
            setUsage(getUsageState(user?.email || undefined));
          }
        } catch (serverErr: any) {
          // If server is not running, seamlessly fallback to Local Browser DSP Engine
          if (serverErr.message?.includes('Failed to fetch') || serverErr.name === 'TypeError') {
            console.warn('Python server unreachable. Automatically falling back to Browser DSP Engine.');
            setEngineMode('LOCAL');
            
            const localFileResults: FileQCResult[] = [];
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              setCurrentFilename(file.name);
              setFileStatuses((prev) =>
                prev.map((s, idx) => (idx === i ? { ...s, status: 'ANALYZING' } : s))
              );

              const measurements = await analyzeAudioFileLocally(file);
              const fileQcResult = convertLocalMeasurementsToFileQCResult(measurements, selectedProfile);
              localFileResults.push(fileQcResult);

              setCompletedCount(i + 1);
              setFileStatuses((prev) =>
                prev.map((s, idx) => (idx === i ? { ...s, status: 'DONE', qcResultStatus: fileQcResult.overall_status } : s))
              );
            }

            const passed = localFileResults.filter((f) => f.overall_status === 'PASS').length;
            const warnings = localFileResults.filter((f) => f.overall_status === 'WARNING').length;
            const failed = localFileResults.filter((f) => f.overall_status === 'FAIL').length;
            const errors = localFileResults.filter((f) => f.overall_status === 'ERROR').length;
            const overall = failed > 0 || errors > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS';

            const syntheticBatch: BatchQCResult = {
              batch_id: `batch_local_${Date.now()}`,
              created_at: new Date().toISOString(),
              profile_id: selectedProfile.profile_id,
              profile_name: selectedProfile.name,
              files: localFileResults,
              consistency_issues: [],
              summary: {
                total_files: localFileResults.length,
                passed,
                warnings,
                failed,
                errors,
                avg_lufs: localFileResults[0]?.loudness?.integrated_lufs ?? null,
                highest_true_peak_dbtp: Math.max(...localFileResults.map(f => f.peaks?.true_peak_dbtp ?? -99)),
                total_duration_seconds: localFileResults.reduce((acc, f) => acc + (f.file_info?.duration_seconds ?? 0), 0),
                batch_health: overall === 'FAIL' ? 'CRITICAL_ISSUES' : overall === 'WARNING' ? 'NEEDS_ATTENTION' : 'HEALTHY',
                batch_health_reasons: []
              },
              overall_status: overall
            };

            setBatchResult(syntheticBatch);
            saveBatchToHistory(syntheticBatch, user?.email || undefined);
            setUsage(getUsageState(user?.email || undefined));
          } else {
            throw serverErr;
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setIsPartialCancelled(true);
        setErrorMessage('Analysis was cancelled by the user.');
      } else {
        console.error('Analysis error:', err);
        setErrorMessage(
          err.message || 'Unable to complete analysis. Please verify your audio files.'
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Retry single file analysis
  const handleRetryFile = async (filename: string) => {
    if (!batchResult || !selectedProfile) return;
    const fileObj = files.find((f) => f.name === filename);
    if (!fileObj) {
      alert(`Original file '${filename}' is not available in current staging queue to retry.`);
      return;
    }

    setRetryingFilename(filename);
    try {
      let updatedResult: FileQCResult;
      if (engineMode === 'LOCAL') {
        const measurements = await analyzeAudioFileLocally(fileObj);
        updatedResult = convertLocalMeasurementsToFileQCResult(measurements, selectedProfile);
      } else {
        updatedResult = await analyzeSingleFile(fileObj, selectedProfile.profile_id, undefined, userTier);
      }
      
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
    setSelectedInspectFile(null);
  };

  // Available Formats & Sample Rates in current batch
  const { availableFormats, availableSampleRates } = useMemo(() => {
    if (!batchResult) return { availableFormats: [], availableSampleRates: [] };
    const fmts = new Set<string>();
    const srs = new Set<number>();
    batchResult.files.forEach((f) => {
      if (f.file_info) {
        if (f.file_info.format) fmts.add(f.file_info.format.toUpperCase());
        if (f.file_info.sample_rate) srs.add(f.file_info.sample_rate);
      }
    });
    return {
      availableFormats: Array.from(fmts),
      availableSampleRates: Array.from(srs).sort((a, b) => a - b)
    };
  }, [batchResult]);

  // Filtered & Sorted File Results
  const filteredAndSortedFiles = useMemo(() => {
    if (!batchResult) return [];

    let list = [...batchResult.files];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.filename.toLowerCase().includes(q));
    }

    if (activeFilter !== 'ALL') {
      list = list.filter((f) => f.overall_status === activeFilter);
    }

    if (formatFilter !== 'ALL') {
      list = list.filter((f) => f.file_info?.format?.toUpperCase() === formatFilter);
    }

    if (sampleRateFilter !== 'ALL') {
      list = list.filter((f) => String(f.file_info?.sample_rate) === sampleRateFilter);
    }

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
  }, [batchResult, searchQuery, activeFilter, formatFilter, sampleRateFilter, activeSort]);

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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Tier & Plan Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <AudioWaveform className="w-3.5 h-3.5" />
              <span>Sonichecks &bull; Audio Quality Control Engine</span>
            </div>

            {engineMode === 'LOCAL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <Cpu className="w-3 h-3" />
                <span>Zero Upload / Local DSP</span>
              </span>
            )}
          </div>

          <TierBadgeSelector />
        </div>

        {/* Page Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Audio Quality Control Workspace
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            {userTier === 'FREE' ? (
              <>Inspect individual master tracks with deterministic DSP signal analysis. (Free Tier: 1 file at a time).</>
            ) : (
              <>Analyze up to {tierConfig.maxBatchSize} audio files concurrently with multi-track batch matrix alignment.</>
            )}
          </p>
        </div>

        {/* Error / Notice Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice</p>
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
            {/* Top Actions with Tier Gating */}
            <ExportActions
              batchResult={batchResult}
              userTier={userTier}
              onGatedAction={triggerGate}
              onReset={handleReset}
            />

            {/* Summary Card with Health Diagnosis */}
            <BatchSummaryCard batchResult={batchResult} isPartial={isPartialCancelled} />

            {/* Consistency & Outlier Warning Banner */}
            {batchResult.files.length > 1 && (
              <ConsistencyAlertBanner issues={batchResult.consistency_issues} />
            )}

            {/* View Mode Switcher Toolbar */}
            {batchResult.files.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">View Mode:</span>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setViewMode('MATRIX')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'MATRIX'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>QC Matrix</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('CARDS')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'CARDS'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Track Cards</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Comparison Matrix Table */}
            {viewMode === 'MATRIX' && (
              <BatchComparisonMatrix
                batchResult={{
                  ...batchResult,
                  files: filteredAndSortedFiles
                }}
                isGated={userTier === 'FREE' && batchResult.files.length > 1}
                onUpgradeClick={() => triggerGate('Batch QC Comparison Matrix', 'Side-by-side alignment across tracks is available on Pro.', 'PRO')}
                onSelectFileDetail={(file) => setSelectedInspectFile(file)}
              />
            )}

            {/* Filter & Search Toolbar */}
            {batchResult.files.length > 1 && (
              <FilterSortBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                activeSort={activeSort}
                onSortChange={setActiveSort}
                formatFilter={formatFilter}
                onFormatFilterChange={setFormatFilter}
                availableFormats={availableFormats}
                sampleRateFilter={sampleRateFilter}
                onSampleRateFilterChange={setSampleRateFilter}
                availableSampleRates={availableSampleRates}
                counts={counts}
              />
            )}

            {/* Per-Track Results Cards (when in Cards mode or Single File) */}
            {(viewMode === 'CARDS' || batchResult.files.length === 1) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Showing {filteredAndSortedFiles.length} of {batchResult.files.length} inspected track{batchResult.files.length > 1 ? 's' : ''}</span>
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
            )}

            {/* Bottom Export Toolbar */}
            <ExportActions
              batchResult={batchResult}
              userTier={userTier}
              onGatedAction={triggerGate}
              onReset={handleReset}
            />
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
                engineMode={engineMode}
                onSelectEngineMode={setEngineMode}
              />
            )}
          </div>
        )}
      </div>

      {/* Selected Single Track Modal */}
      {selectedInspectFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white truncate max-w-md">
                {selectedInspectFile.filename}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedInspectFile(null)}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                &larr; Return to Matrix
              </button>
            </div>

            <FileResultCard result={selectedInspectFile} />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedInspectFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Gating Modal */}
      <UpgradePromptModal
        prompt={upgradePrompt}
        onClose={() => setUpgradePrompt(null)}
      />
    </div>
  );
}
