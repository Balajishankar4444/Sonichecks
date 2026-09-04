import { parseWavAudioData } from './wav-parser';
import { calculateDspMetrics } from './dsp-metrics';
import { calculateLoudness } from './lufs';
import { calculateTruePeak } from './true-peak';
import { LocalAudioMeasurements, WavMetadata } from './types';
import { calculateBufferSha256 } from './analyzer';

export async function analyzeAudioBufferUniversal(
  buffer: ArrayBuffer,
  filename: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<LocalAudioMeasurements> {
  const startTime = performance.now();
  const lowerName = filename.toLowerCase();
  const ext = filename.split('.').pop()?.toUpperCase() || 'AUDIO';

  // 1. SHA-256 calculation
  if (onProgress) onProgress('HASHING_FILE', 15);
  const sha256Hash = await calculateBufferSha256(buffer);

  let channels: Float32Array[] = [];
  let sampleRate = 44100;
  let metadata: WavMetadata;

  // Check if uncompressed WAV
  const view = new DataView(buffer);
  const isRiffWav = buffer.byteLength >= 12 && 
    String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)) === 'RIFF';

  if (isRiffWav && lowerName.endsWith('.wav')) {
    if (onProgress) onProgress('PARSING_WAV', 30);
    const parsed = parseWavAudioData(buffer);
    channels = parsed.channels;
    sampleRate = parsed.metadata.sampleRate;
    parsed.metadata.sha256Hash = sha256Hash;
    metadata = parsed.metadata;
  } else {
    // 2. Decode MP3, FLAC, AAC, M4A, OGG, AIFF using Browser Web Audio API
    if (onProgress) onProgress('DECODING_AUDIO', 30);

    if (typeof window === 'undefined') {
      throw new Error(`Audio decoding for ${ext} requires browser Web Audio API environment.`);
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser.');
    }

    const audioCtx = new AudioContextClass();
    let audioBuffer: AudioBuffer;

    try {
      // slice(0) to pass a clone since decodeAudioData detaches the buffer
      audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0));
    } catch (decodeErr: any) {
      await audioCtx.close().catch(() => {});
      throw new Error(`Could not decode ${ext} audio: ${decodeErr?.message || 'Invalid or unsupported audio container.'}`);
    }

    sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const durationSeconds = Math.round(audioBuffer.duration * 1000) / 1000;
    const numSamples = audioBuffer.length;
    const bitDepth = ext === 'FLAC' ? 24 : 16;

    for (let c = 0; c < numChannels; c++) {
      channels.push(audioBuffer.getChannelData(c));
    }

    await audioCtx.close().catch(() => {});

    metadata = {
      format: ext,
      audioFormat: 1,
      audioFormatName: `${ext} (Decoded)`,
      channels: numChannels,
      channelLayout: numChannels === 1 ? 'Mono' : numChannels === 2 ? 'Stereo' : `${numChannels} Channels`,
      sampleRate,
      bitDepth,
      byteRate: sampleRate * numChannels * (bitDepth / 8),
      blockAlign: numChannels * (bitDepth / 8),
      dataChunkOffset: 0,
      dataChunkSize: buffer.byteLength,
      durationSeconds,
      numSamples,
      fileSizeBytes: buffer.byteLength,
      sha256Hash
    };
  }

  // 3. DSP Metrics (Sample Peak, RMS, DC Offset, Clipping, Silence, Waveform)
  if (onProgress) onProgress('ANALYZING_METRICS', 55);
  const metrics = calculateDspMetrics(channels, sampleRate);

  // 4. ITU-R BS.1770-4 Integrated LUFS, Short-Term Max, and EBU Tech 3342 LRA
  if (onProgress) onProgress('ANALYZING_LUFS', 75);
  const loudness = calculateLoudness(channels, sampleRate);

  // 5. 4x Oversampled Polyphase True Peak (dBTP)
  if (onProgress) onProgress('ANALYZING_TRUE_PEAK', 90);
  const truePeak = calculateTruePeak(channels, sampleRate);

  if (onProgress) onProgress('COMPLETE', 100);
  const totalDurationMs = Math.round(performance.now() - startTime);

  return {
    filename,
    fileSizeBytes: buffer.byteLength,
    sha256Hash,
    metadata,
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
