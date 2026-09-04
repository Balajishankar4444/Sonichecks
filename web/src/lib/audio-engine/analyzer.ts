import { parseWavAudioData } from './wav-parser';
import { calculateDspMetrics } from './dsp-metrics';
import { calculateLoudness } from './lufs';
import { calculateTruePeak } from './true-peak';
import { LocalAudioMeasurements } from './types';

export async function calculateBufferSha256(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return 'sha256-unavailable-in-env';
}

export async function analyzeWavBuffer(
  buffer: ArrayBuffer,
  filename: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<LocalAudioMeasurements> {
  const startTime = performance.now();

  if (onProgress) onProgress('PARSING_WAV', 15);
  const parsed = parseWavAudioData(buffer);

  if (onProgress) onProgress('HASHING_FILE', 30);
  const sha256Hash = await calculateBufferSha256(buffer);
  parsed.metadata.sha256Hash = sha256Hash;

  if (onProgress) onProgress('ANALYZING_METRICS', 50);
  const metrics = calculateDspMetrics(parsed.channels, parsed.metadata.sampleRate);

  if (onProgress) onProgress('ANALYZING_LUFS', 70);
  const loudness = calculateLoudness(parsed.channels, parsed.metadata.sampleRate);

  if (onProgress) onProgress('ANALYZING_TRUE_PEAK', 85);
  const truePeak = calculateTruePeak(parsed.channels, parsed.metadata.sampleRate);

  if (onProgress) onProgress('COMPLETE', 100);
  const totalDurationMs = Math.round(performance.now() - startTime);

  return {
    filename,
    fileSizeBytes: buffer.byteLength,
    sha256Hash,
    metadata: parsed.metadata,
    // Loudness
    integratedLufs: loudness.integratedLufs,
    momentaryMaxLufs: loudness.momentaryMaxLufs,
    momentaryMaxTimestampSec: loudness.momentaryMaxTimestampSec,
    shortTermMaxLufs: loudness.shortTermMaxLufs,
    shortTermMaxTimestampSec: loudness.shortTermMaxTimestampSec,
    loudnessRangeLu: loudness.loudnessRangeLu,
    // Peaks & True Peak
    samplePeakLinear: metrics.samplePeakLinear,
    samplePeakDbfs: metrics.samplePeakDbfs,
    truePeakLinear: truePeak.truePeakLinear,
    truePeakDbtp: truePeak.truePeakDbtp,
    truePeakTimestampSec: truePeak.truePeakTimestampSec,
    isClippingRisk: truePeak.isClippingRisk || metrics.samplePeakDbfs >= -0.05,
    // RMS & DC
    rmsLinear: metrics.rmsLinear,
    rmsDbfs: metrics.rmsDbfs,
    dcOffsetLinear: metrics.dcOffsetLinear,
    dcOffsetPercent: metrics.dcOffsetPercent,
    channelMetrics: metrics.channelMetrics,
    clipping: metrics.clipping,
    silence: metrics.silence,
    waveformEnvelope: metrics.waveformEnvelope,
    analysisDurationMs: totalDurationMs
  };
}
