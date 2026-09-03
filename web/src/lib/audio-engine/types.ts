export interface WavMetadata {
  format: string; // 'WAV', 'MP3', 'FLAC', 'AAC', 'M4A', etc.
  audioFormat: number; // 1 = PCM, 3 = IEEE Float
  audioFormatName: string; // "PCM" or "Compressed/Decoded"
  channels: number;
  channelLayout: string; // "Mono", "Stereo", "5.1 Surround", etc.
  sampleRate: number;
  bitDepth: number;
  byteRate: number;
  blockAlign: number;
  dataChunkOffset: number;
  dataChunkSize: number;
  numSamples: number;
  durationSeconds: number;
  fileSizeBytes: number;
  sha256Hash?: string;
}

export interface ChannelMetrics {
  channelIndex: number;
  samplePeakLinear: number;
  samplePeakDbfs: number;
  rmsLinear: number;
  rmsDbfs: number;
  dcOffsetLinear: number;
  dcOffsetPercent: number;
  clippedSamples: number;
}

export interface LocalAudioMeasurements {
  filename: string;
  fileSizeBytes: number;
  sha256Hash: string;
  metadata: WavMetadata;
  // Loudness (ITU-R BS.1770-4)
  integratedLufs: number;
  momentaryMaxLufs: number | null;
  shortTermMaxLufs: number | null;
  loudnessRangeLu: number | null;
  // Peaks & True Peak (4x Oversampled)
  samplePeakLinear: number;
  samplePeakDbfs: number;
  truePeakLinear: number;
  truePeakDbtp: number;
  isClippingRisk: boolean;
  // RMS & DC Offset
  rmsLinear: number;
  rmsDbfs: number;
  dcOffsetLinear: number;
  dcOffsetPercent: number;
  channelMetrics: ChannelMetrics[];
  // Clipping
  clipping: {
    clippingDetected: boolean;
    clippedSamples: number;
    consecutiveClippedRuns: number;
    maxConsecutiveClipped: number;
  };
  // Silence
  silence: {
    leadingSilenceSec: number;
    trailingSilenceSec: number;
    totalSilenceSec: number;
    isCompletelySilent: boolean;
    excessiveSilenceDetected: boolean;
  };
  analysisDurationMs: number;
}

export type WorkerRequest = 
  | { type: 'ANALYZE_WAV'; payload: { file: File } }
  | { type: 'ANALYZE_BUFFER'; payload: { buffer: ArrayBuffer; filename: string } };

export type WorkerProgressStage = 
  | 'READING_FILE'
  | 'PARSING_WAV'
  | 'ANALYZING_METRICS'
  | 'ANALYZING_LUFS'
  | 'ANALYZING_TRUE_PEAK'
  | 'COMPLETE'
  | 'ERROR';

export type WorkerResponse =
  | { type: 'PROGRESS'; stage: WorkerProgressStage; message: string; progressPercent: number }
  | { type: 'SUCCESS'; result: LocalAudioMeasurements }
  | { type: 'ERROR'; error: string };
