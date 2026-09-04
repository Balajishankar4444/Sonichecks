import { ChannelMetrics } from './types';

export interface CalculatedDspMetrics {
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
    clippingTimestampsSec?: number[];
  };
  silence: {
    leadingSilenceSec: number;
    trailingSilenceSec: number;
    totalSilenceSec: number;
    isCompletelySilent: boolean;
    excessiveSilenceDetected: boolean;
  };
  waveformEnvelope?: number[];
}

export function linearToDbfs(linear: number, floorDb: number = -100.0): number {
  if (linear <= 1e-6 || isNaN(linear)) {
    return floorDb;
  }
  const db = 20.0 * Math.log10(linear);
  return Math.round(db * 100) / 100;
}

export function calculateDspMetrics(
  channels: Float32Array[],
  sampleRate: number
): CalculatedDspMetrics {
  const numChannels = channels.length;
  if (numChannels === 0 || channels[0].length === 0) {
    return {
      samplePeakLinear: 0.0,
      samplePeakDbfs: -100.0,
      rmsLinear: 0.0,
      rmsDbfs: -100.0,
      dcOffsetLinear: 0.0,
      dcOffsetPercent: 0.0,
      channelMetrics: [],
      clipping: {
        clippingDetected: false,
        clippedSamples: 0,
        consecutiveClippedRuns: 0,
        maxConsecutiveClipped: 0,
        clippingTimestampsSec: []
      },
      silence: {
        leadingSilenceSec: 0.0,
        trailingSilenceSec: 0.0,
        totalSilenceSec: 0.0,
        isCompletelySilent: true,
        excessiveSilenceDetected: true
      },
      waveformEnvelope: []
    };
  }

  const numSamples = channels[0].length;
  const channelMetrics: ChannelMetrics[] = [];

  let globalPeakLinear = 0.0;
  let totalSumOfSquares = 0.0;
  let totalSumOfSamples = 0.0;
  let totalClippedSamples = 0;
  let totalClippedRuns = 0;
  let maxConsecutiveClipped = 0;
  const clippingTimestamps: number[] = [];

  const clipThreshold = 0.9999;
  const minClipRun = 3;

  for (let ch = 0; ch < numChannels; ch++) {
    const data = channels[ch];
    let chPeakLinear = 0.0;
    let chSumOfSquares = 0.0;
    let chSumOfSamples = 0.0;
    let chClippedSamples = 0;
    let currentClipRun = 0;
    let chClippedRuns = 0;
    let runStartIdx = 0;

    for (let i = 0; i < numSamples; i++) {
      const sample = data[i];
      const absSample = Math.abs(sample);

      // Peak
      if (absSample > chPeakLinear) {
        chPeakLinear = absSample;
      }

      // Energy sums
      chSumOfSquares += sample * sample;
      chSumOfSamples += sample;

      // Clipping
      if (absSample >= clipThreshold) {
        if (currentClipRun === 0) runStartIdx = i;
        chClippedSamples++;
        currentClipRun++;
        if (currentClipRun > maxConsecutiveClipped) {
          maxConsecutiveClipped = currentClipRun;
        }
      } else {
        if (currentClipRun >= minClipRun) {
          chClippedRuns++;
          const tSec = Math.round((runStartIdx / sampleRate) * 1000) / 1000;
          if (clippingTimestamps.length < 15 && !clippingTimestamps.some(t => Math.abs(t - tSec) < 0.2)) {
            clippingTimestamps.push(tSec);
          }
        }
        currentClipRun = 0;
      }
    }

    if (currentClipRun >= minClipRun) {
      chClippedRuns++;
      const tSec = Math.round((runStartIdx / sampleRate) * 1000) / 1000;
      if (clippingTimestamps.length < 15 && !clippingTimestamps.some(t => Math.abs(t - tSec) < 0.2)) {
        clippingTimestamps.push(tSec);
      }
    }

    if (chPeakLinear > globalPeakLinear) {
      globalPeakLinear = chPeakLinear;
    }

    totalSumOfSquares += chSumOfSquares;
    totalSumOfSamples += chSumOfSamples;
    totalClippedSamples += chClippedSamples;
    totalClippedRuns += chClippedRuns;

    const chRmsLinear = Math.sqrt(chSumOfSquares / numSamples);
    const chDcOffset = chSumOfSamples / numSamples;

    channelMetrics.push({
      channelIndex: ch,
      samplePeakLinear: Math.round(chPeakLinear * 100000) / 100000,
      samplePeakDbfs: linearToDbfs(chPeakLinear),
      rmsLinear: Math.round(chRmsLinear * 100000) / 100000,
      rmsDbfs: linearToDbfs(chRmsLinear),
      dcOffsetLinear: Math.round(chDcOffset * 100000) / 100000,
      dcOffsetPercent: Math.round(chDcOffset * 10000) / 100,
      clippedSamples: chClippedSamples
    });
  }

  const globalRmsLinear = Math.sqrt(totalSumOfSquares / (numSamples * numChannels));
  const globalDcOffset = totalSumOfSamples / (numSamples * numChannels);

  const clippingDetected = totalClippedRuns > 0 || totalClippedSamples >= 10;

  // Waveform Downsampled Envelope Generation (100 peak buckets)
  const numBuckets = 100;
  const bucketSize = Math.max(1, Math.floor(numSamples / numBuckets));
  const waveformEnvelope: number[] = [];

  for (let b = 0; b < numBuckets; b++) {
    const start = b * bucketSize;
    const end = Math.min(start + bucketSize, numSamples);
    let bucketMax = 0.0;

    for (let ch = 0; ch < numChannels; ch++) {
      const data = channels[ch];
      for (let i = start; i < end; i += 4) { // stride of 4 for speed
        const v = Math.abs(data[i]);
        if (v > bucketMax) bucketMax = v;
      }
    }
    waveformEnvelope.push(Math.round(bucketMax * 1000) / 1000);
  }

  // Silence Detection (50ms RMS frames with -60 dBFS threshold)
  const windowMs = 50.0;
  const frameSize = Math.max(1, Math.floor((windowMs / 1000.0) * sampleRate));
  const numFrames = Math.floor(numSamples / frameSize);
  const silenceThresholdLinear = Math.pow(10.0, -60.0 / 20.0); // 0.001

  const durationSeconds = numSamples / sampleRate;

  let leadingSilenceSec = 0.0;
  let trailingSilenceSec = 0.0;
  let totalSilenceSec = 0.0;
  let isCompletelySilent = false;
  let excessiveSilenceDetected = false;

  if (globalPeakLinear < silenceThresholdLinear) {
    isCompletelySilent = true;
    excessiveSilenceDetected = true;
    leadingSilenceSec = Math.round(durationSeconds * 1000) / 1000;
    trailingSilenceSec = Math.round(durationSeconds * 1000) / 1000;
    totalSilenceSec = Math.round(durationSeconds * 1000) / 1000;
  } else if (numFrames > 0) {
    const nonSilentFrames: number[] = [];

    for (let f = 0; f < numFrames; f++) {
      let frameSumOfSquares = 0.0;
      const startIdx = f * frameSize;

      for (let ch = 0; ch < numChannels; ch++) {
        const data = channels[ch];
        for (let i = 0; i < frameSize; i++) {
          const s = data[startIdx + i];
          frameSumOfSquares += s * s;
        }
      }

      const frameRms = Math.sqrt(frameSumOfSquares / (frameSize * numChannels));
      if (frameRms >= silenceThresholdLinear) {
        nonSilentFrames.push(f);
      }
    }

    if (nonSilentFrames.length === 0) {
      isCompletelySilent = true;
      excessiveSilenceDetected = true;
      leadingSilenceSec = Math.round(durationSeconds * 1000) / 1000;
      trailingSilenceSec = Math.round(durationSeconds * 1000) / 1000;
      totalSilenceSec = Math.round(durationSeconds * 1000) / 1000;
    } else {
      const firstActiveFrame = nonSilentFrames[0];
      const lastActiveFrame = nonSilentFrames[nonSilentFrames.length - 1];

      leadingSilenceSec = Math.round(((firstActiveFrame * frameSize) / sampleRate) * 1000) / 1000;
      trailingSilenceSec = Math.round((((numFrames - 1 - lastActiveFrame) * frameSize) / sampleRate) * 1000) / 1000;

      const silentFrameCount = numFrames - nonSilentFrames.length;
      totalSilenceSec = Math.round(((silentFrameCount * frameSize) / sampleRate) * 1000) / 1000;

      if (leadingSilenceSec > 3.0 || trailingSilenceSec > 5.0) {
        excessiveSilenceDetected = true;
      }
    }
  }

  return {
    samplePeakLinear: Math.round(globalPeakLinear * 100000) / 100000,
    samplePeakDbfs: linearToDbfs(globalPeakLinear),
    rmsLinear: Math.round(globalRmsLinear * 100000) / 100000,
    rmsDbfs: linearToDbfs(globalRmsLinear),
    dcOffsetLinear: Math.round(globalDcOffset * 100000) / 100000,
    dcOffsetPercent: Math.round(globalDcOffset * 10000) / 100,
    channelMetrics,
    clipping: {
      clippingDetected,
      clippedSamples: totalClippedSamples,
      consecutiveClippedRuns: totalClippedRuns,
      maxConsecutiveClipped,
      clippingTimestampsSec: clippingTimestamps
    },
    silence: {
      leadingSilenceSec,
      trailingSilenceSec,
      totalSilenceSec,
      isCompletelySilent,
      excessiveSilenceDetected
    },
    waveformEnvelope
  };
}
