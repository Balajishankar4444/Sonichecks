export interface WavMetadata {
  format: 'WAV' | 'WAVE';
  audioFormat: number; // 1 = PCM, 3 = IEEE Float
  audioFormatName: string; // "PCM" or "IEEE Float"
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
  samplePeakLinear: number;
  samplePeakDbfs: number;
  rmsLinear: number;
  rmsDbfs: number;
  dcOffsetLinear: number;
  dcOffsetPercent: number;
  channelMetrics: ChannelMetrics[];
  clipping: {
    clippingDetected: boolean;
    clippedSamples: number;
    consecutiveClippedRuns: number;
    maxConsecutiveClipped: number;
  };
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
  | 'COMPLETE'
  | 'ERROR';

export type WorkerResponse =
  | { type: 'PROGRESS'; stage: WorkerProgressStage; message: string; progressPercent: number }
  | { type: 'SUCCESS'; result: LocalAudioMeasurements }
  | { type: 'ERROR'; error: string };
