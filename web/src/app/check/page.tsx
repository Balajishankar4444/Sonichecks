'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Sparkles, AudioWaveform, SlidersHorizontal, Music } from 'lucide-react';
import AudioDropzone from '@/components/upload/AudioDropzone';
import FileQueueList from '@/components/upload/FileQueueList';
import LoadingSteps from '@/components/common/LoadingSteps';
import BatchSummaryCard from '@/components/results/BatchSummaryCard';
import ConsistencyAlertBanner from '@/components/results/ConsistencyAlertBanner';
import FileResultCard from '@/components/results/FileResultCard';
import ExportActions from '@/components/results/ExportActions';
import { BatchQCResult, QCProfile } from '@/types/qc';
import { getQCProfiles, analyzeBatchFiles } from '@/lib/api';
import { saveBatchToHistory } from '@/lib/storage';

export default function CheckPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [profiles, setProfiles] = useState<QCProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<QCProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchQCResult | null>(null);

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
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setFiles([]);
    setErrorMessage(null);
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0 || !selectedProfile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzeBatchFiles(files, selectedProfile.profile_id);
      setBatchResult(result);
      saveBatchToHistory(result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(
        err.message || 'Unable to complete audio analysis. Please verify your files and ensure the audio engine is active.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setBatchResult(null);
    setFiles([]);
    setErrorMessage(null);
  };

  // Helper to generate a test synthetic WAV client-side for instant demo testing
  const loadDemoTestBatch = () => {
    // Generate clean sine 48k
    const sr = 48000;
    const dur = 2.0;
    const numSamples = sr * dur;
    
    // Create WAV helper buffer
    const createWavBlob = (generator: (i: number) => number, sampleRate: number): File => {
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
      return new File([blob], 'demo_track.wav', { type: 'audio/wav' });
    };

    // Track 1: Clean -14 LUFS 48k
    const file1 = createWavBlob((i) => 0.2 * Math.sin((2 * Math.PI * 440 * i) / 48000), 48000);
    const track1 = new File([file1], '01_Clean_Master_48k.wav', { type: 'audio/wav' });

    // Track 2: Overloaded Clipped 44.1k
    const file2 = createWavBlob((i) => Math.max(-0.9999, Math.min(0.9999, 1.8 * Math.sin((2 * Math.PI * 220 * i) / 44100))), 44100);
    const track2 = new File([file2], '02_Clipped_Distorted_44k.wav', { type: 'audio/wav' });

    setFiles([track1, track2]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <AudioWaveform className="w-3.5 h-3.5" />
            <span>Deterministic QC Engine &bull; ITU-R BS.1770-4</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Audio Quality Control Workspace
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Drop your WAV, AIFF, FLAC, or MP3 deliverables. Get instant PASS/FAIL verdicts, loudness compliance, true-peak measurements, and clipping alerts.
          </p>
        </div>

        {/* Demo Quick Load Banner */}
        {files.length === 0 && !batchResult && !isAnalyzing && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Want to test immediately with real sample files?</span>
            </div>
            <button
              type="button"
              onClick={loadDemoTestBatch}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold transition-colors"
            >
              Load Demo Test Audio
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Analysis Notice</p>
              <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* State 1: Loading State */}
        {isAnalyzing && (
          <div className="py-12">
            <LoadingSteps fileCount={files.length} />
          </div>
        )}

        {/* State 2: Results View */}
        {!isAnalyzing && batchResult && (
          <div className="space-y-8 animate-fadeIn">
            {/* Action Bar */}
            <ExportActions batchResult={batchResult} onReset={handleReset} />

            {/* Batch Summary */}
            <BatchSummaryCard batchResult={batchResult} />

            {/* Batch Consistency Alert Banner (if mismatched rates/depths) */}
            <ConsistencyAlertBanner issues={batchResult.consistency_issues} />

            {/* Per-Track Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Inspected Audio Files ({batchResult.files.length})
                </h3>
              </div>
              {batchResult.files.map((fileRes) => (
                <FileResultCard key={fileRes.file_id} result={fileRes} />
              ))}
            </div>

            {/* Bottom Export Toolbar */}
            <ExportActions batchResult={batchResult} onReset={handleReset} />
          </div>
        )}

        {/* State 3: Upload & Staged Queue View */}
        {!isAnalyzing && !batchResult && (
          <div className="space-y-6">
            <AudioDropzone onFilesSelected={handleFilesSelected} disabled={isAnalyzing} />

            {selectedProfile && profiles.length > 0 && (
              <FileQueueList
                files={files}
                onRemoveFile={handleRemoveFile}
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
