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
  Cpu,
  Plus
} from 'lucide-react';
import AudioDropzone from '@/components/upload/AudioDropzone';
import FileQueueList, { AnalysisEngineMode } from '@/components/upload/FileQueueList';
import LoadingSteps, { FileAnalysisStatus } from '@/components/common/LoadingSteps';
import BatchSummaryCard from '@/components/results/BatchSummaryCard';
import ConsistencyAlertBanner from '@/components/results/ConsistencyAlertBanner';
import FileResultCard from '@/components/results/FileResultCard';
import FilterSortBar, { FilterStatus, SortOption } from '@/components/results/FilterSortBar';
import ExportActions from '@/components/results/ExportActions';
import BatchComparisonMatrix from '@/components/qc/BatchComparisonMatrix';
import ProfileFinder from '@/components/qc/ProfileFinder';
import ProfileSelector from '@/components/qc/ProfileSelector';
import CustomProfileModal from '@/components/qc/CustomProfileModal';
import UpgradePromptModal, { UpgradePromptState } from '@/components/common/UpgradePromptModal';
import TierBadgeSelector from '@/components/common/TierBadgeSelector';
import { BatchQCResult, FileQCResult, QCProfile, QCStatus } from '@/types/qc';
import { VERIFIED_DELIVERY_PROFILES, getProfileById, getAllProfiles } from '@/config/delivery-standards';
import { loadCustomProfiles } from '@/lib/storage/custom-profiles';
import { saveBatchToHistory, getUsageState, updatePlan, UsageState } from '@/lib/storage';
import { ProductTier, TIER_CONFIGS, getTierConfig } from '@/config/tiers';
import { useAuth } from '@/context/AuthContext';
import { analyzeAudioFileLocally } from '@/lib/audio-engine/client';
import { convertLocalMeasurementsToFileQCResult } from '@/lib/audio-engine/adapter';

export default function CheckPage() {
  const { user, openAuthModal, syncUserWithServer } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [customProfiles, setCustomProfiles] = useState<QCProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<QCProfile>(VERIFIED_DELIVERY_PROFILES[0]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  
  const [engineMode, setEngineMode] = useState<AnalysisEngineMode>('LOCAL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchQCResult | null>(null);
  const [isPartialCancelled, setIsPartialCancelled] = useState(false);

  // User Tier and Usage State
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

  // View state & Inspect Modal
  const [viewMode, setViewMode] = useState<'MATRIX' | 'CARDS'>('MATRIX');
  const [selectedInspectFile, setSelectedInspectFile] = useState<FileQCResult | null>(null);

  // Abort controller ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setUsage(getUsageState(user?.email || undefined));
    const loadedCustom = loadCustomProfiles();
    setCustomProfiles(loadedCustom);

    // Check URL parameters for preset profile
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const profileParam = urlParams.get('profile')?.toLowerCase();
      if (profileParam) {
        const all = getAllProfiles(loadedCustom);
        const matched = all.find(p => p.profile_id.toLowerCase() === profileParam);
        if (matched) setSelectedProfile(matched);
      }
    }

    const handleCustomProfilesUpdated = (e: any) => {
      setCustomProfiles(e.detail || loadCustomProfiles());
    };
    window.addEventListener('sonichecks_custom_profiles_updated', handleCustomProfilesUpdated);

    return () => {
      window.removeEventListener('sonichecks_custom_profiles_updated', handleCustomProfilesUpdated);
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
        if (seenNames.has(file.name)) return false;
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

    // Login requirement
    if (!user) {
      openAuthModal(() => {
        setTimeout(() => {
          handleStartAnalysis();
        }, 150);
      });
      return;
    }

    // Check monthly allowance limit with backend synchronization (Studio is completely Unlimited)
    const isStudioTier = userTier === 'STUDIO' || user?.plan === 'studio';
    if (!isStudioTier) {
      if (user?.email) {
        try {
          const usageRes = await fetch(`/api/user/usage?email=${encodeURIComponent(user.email)}`);
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            const isDataStudio = usageData.plan === 'studio' || usageData.monthlyAllowance === -1;
            if (!isDataStudio && usageData.monthlyAllowance > 0 && usageData.filesChecked + files.length > usageData.monthlyAllowance) {
              triggerGate(
                'Monthly QC Allowance Exceeded',
                `You have used ${usageData.filesChecked} of your ${usageData.monthlyAllowance} monthly checks on the ${usageData.plan?.toUpperCase()} plan. Your quota resets on ${new Date(usageData.resetDate).toLocaleDateString()}. Upgrade to unlock higher file allowances.`,
                userTier === 'FREE' ? 'PRO' : 'STUDIO'
              );
              return;
            }
          }
        } catch (e) {
          console.warn('Backend usage pre-check fallback to local:', e);
        }
      } else if (usage && tierConfig.monthlyFileLimit !== Infinity && usage.filesChecked + files.length > tierConfig.monthlyFileLimit) {
        triggerGate(
          'Monthly QC Allowance Exceeded',
          `You have used ${usage.filesChecked} of your ${tierConfig.monthlyFileLimit} monthly checks on the ${tierConfig.name} plan. Upgrade to unlock higher file allowances.`,
          userTier === 'FREE' ? 'PRO' : 'STUDIO'
        );
        return;
      }
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
      // 100% In-Browser Local DSP Analysis (Web Audio API & Web Workers)
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
          const measurements = await analyzeAudioFileLocally(file);
          fileQcResult = convertLocalMeasurementsToFileQCResult(measurements, selectedProfile);
        } catch (audioErr: any) {
          fileQcResult = {
            file_id: `err_${Date.now()}_${i}`,
            filename: file.name,
            overall_status: 'ERROR',
            checks: [],
            fix_summary: ['Ensure the audio file is not corrupted and is an uncompressed or supported audio format (WAV, MP3, FLAC, AIFF).'],
            error_message: audioErr.message || 'Failed to analyze audio in browser'
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
      const overall: QCStatus = failed > 0 || errors > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS';

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
        profile_version: selectedProfile.version,
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
      const updatedUsage = getUsageState(user?.email || undefined);
      setUsage(updatedUsage);

      // Record upload in backend database and sync user state
      if (user?.email) {
        try {
          await fetch('/api/user/usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              fileCount: localFileResults.length,
              clientFilesChecked: updatedUsage.filesChecked
            })
          });
          await syncUserWithServer(user.email);
        } catch (backendErr) {
          console.warn('Backend usage record notice:', backendErr);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setIsPartialCancelled(true);
        setErrorMessage('Analysis was cancelled by the user.');
      } else {
        console.error('Analysis error:', err);
        setErrorMessage(
          err.message || 'Unable to complete audio inspection. Please verify your audio files.'
        );
      }
    } finally {
      setIsAnalyzing(false);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Tier & Plan Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <AudioWaveform className="w-3.5 h-3.5" />
              <span>Sonichecks &bull; Audio Delivery Quality Control</span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <Cpu className="w-3 h-3" />
              <span>100% On-Device / Zero Upload</span>
            </span>
          </div>

          <TierBadgeSelector />
        </div>

        {/* Page Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Audio Delivery QC Workspace
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Audit your masters against verified delivery requirements before submitting to platforms, clients, or distributors.
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

        {/* Pre-Analysis Configuration: Delivery Profile Finder & Library Selector */}
        {!isAnalyzing && !batchResult && (
          <div className="space-y-6">
            {/* 1. Destination Finder */}
            <ProfileFinder
              selectedProfileId={selectedProfile.profile_id}
              onSelectProfile={setSelectedProfile}
              customProfiles={customProfiles}
              userTier={userTier}
              onGatedAction={triggerGate}
            />

            {/* 2. Detailed Profile Selector */}
            <ProfileSelector
              selectedProfile={selectedProfile}
              onSelectProfile={setSelectedProfile}
              customProfiles={customProfiles}
              onOpenCustomBuilder={() => setIsCustomModalOpen(true)}
              userTier={userTier}
              onGatedAction={triggerGate}
            />

            {/* 3. Audio Dropzone */}
            <AudioDropzone
              onFilesSelected={handleFilesSelected}
              disabled={isAnalyzing}
              currentCount={files.length}
              maxBatchSize={tierConfig.maxBatchSize}
            />

            {/* 4. Staged Queue */}
            {files.length > 0 && (
              <FileQueueList
                files={files}
                onRemoveFile={handleRemoveFile}
                onRemoveDuplicates={handleRemoveDuplicates}
                onClearAll={handleClearAll}
                onStartAnalysis={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                selectedProfile={selectedProfile}
                availableProfiles={getAllProfiles(customProfiles)}
                onSelectProfile={setSelectedProfile}
                engineMode={engineMode}
                onSelectEngineMode={setEngineMode}
              />
            )}
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
            {/* Top Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Inspected with:</span>
                <span className="font-bold text-white text-xs">{batchResult.profile_name} (v{batchResult.profile_version || '2.0'})</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audit Another Master / Batch</span>
              </button>
            </div>

            {/* Summary Card with Health Diagnosis */}
            <BatchSummaryCard batchResult={batchResult} isPartial={isPartialCancelled} />

            {/* Multi-Track Batch Matrix */}
            {batchResult.files.length > 1 ? (
              <div className="space-y-6">
                <BatchComparisonMatrix
                  batchResult={batchResult}
                  onSelectFile={(file) => setSelectedInspectFile(file)}
                  selectedFileId={selectedInspectFile?.file_id}
                  userTier={userTier}
                  onGatedAction={triggerGate}
                />

                {/* Individual Inspect View when file chosen from Matrix */}
                {selectedInspectFile && (
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">
                        Detailed Finding Breakdown: <span className="text-cyan-400">{selectedInspectFile.filename}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedInspectFile(null)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Close Detail View
                      </button>
                    </div>
                    <FileResultCard
                      result={selectedInspectFile}
                      audioFile={files.find(f => f.name === selectedInspectFile.filename) || null}
                      userTier={userTier}
                      onGatedAction={triggerGate}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Single File Result Card */
              <div className="space-y-4">
                <FileResultCard
                  result={batchResult.files[0]}
                  audioFile={files[0] || null}
                  userTier={userTier}
                  onGatedAction={triggerGate}
                />
              </div>
            )}

            {/* Bottom Export Actions Bar */}
            <ExportActions
              batchResult={batchResult}
              userTier={userTier}
              onGatedAction={triggerGate}
              onReset={handleReset}
            />
          </div>
        )}
      </div>

      {/* Custom Profile Modal */}
      <CustomProfileModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onProfileCreated={(newP) => {
          setSelectedProfile(newP);
          setCustomProfiles(loadCustomProfiles());
        }}
      />

      {/* Feature Gating Modal */}
      <UpgradePromptModal
        prompt={upgradePrompt}
        onClose={() => setUpgradePrompt(null)}
      />
    </div>
  );
}
