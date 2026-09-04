/**
 * EBU Tech 3342 Loudness Range (LRA) & Short-Term Loudness Measurement
 * Implements standard 3.0s sliding short-term loudness blocks, 10Hz evaluation,
 * absolute gating (-70 LUFS), relative gating (-20 LU), and 10th-95th percentile computation.
 */

export interface ShortTermPoint {
  timeSeconds: number;
  loudnessLufs: number;
}

export interface LraResult {
  loudnessRangeLu: number | null;
  shortTermPoints: ShortTermPoint[];
  shortTermMaxLufs: number | null;
  shortTermMaxTimestampSec?: number | null;
  shortTermMinLufs: number | null;
}

/**
 * Helper to compute percentile on a sorted array of numbers (linear interpolation method).
 */
export function computePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  
  const rank = (p / 100.0) * (sortedValues.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const weight = rank - low;

  return sortedValues[low] * (1.0 - weight) + sortedValues[high] * weight;
}

/**
 * Calculate EBU Tech 3342 Loudness Range (LRA) and Short-Term Loudness.
 * Expects K-weighted Float32Array channels.
 */
export function calculateLoudnessRange(
  filteredChannels: Float32Array[],
  sampleRate: number
): LraResult {
  const numChannels = filteredChannels.length;
  if (numChannels === 0 || filteredChannels[0].length === 0) {
    return {
      loudnessRangeLu: null,
      shortTermPoints: [],
      shortTermMaxLufs: null,
      shortTermMinLufs: null
    };
  }

  const numSamples = filteredChannels[0].length;
  const duration = numSamples / sampleRate;

  // LRA is not defined on audio shorter than 3.0 seconds
  if (duration < 3.0) {
    return {
      loudnessRangeLu: null,
      shortTermPoints: [],
      shortTermMaxLufs: null,
      shortTermMinLufs: null
    };
  }

  // Channel weightings (BS.1770-4)
  const G = numChannels === 1 ? [1.0] : numChannels === 2 ? [1.0, 1.0] : new Array(numChannels).fill(1.0);
  if (numChannels >= 5) {
    G[3] = 1.41; // Ls
    G[4] = 1.41; // Rs
    if (numChannels >= 6) G[5] = 0.0; // LFE
  }

  // 1. EBU Tech 3342 specifies 3.0s window with 1.5s trailing silence appended
  const silenceSamples = Math.floor(1.5 * sampleRate);
  const totalSamples = numSamples + silenceSamples;

  const T_st = 3.0; // 3 seconds window
  const blockSamples = Math.floor(T_st * sampleRate);
  const overlap = 0.97; // 97% overlap per EBU Tech 3342 / pyloudnorm
  const stepRatio = 1.0 - overlap; // 0.03 of 3.0s = 0.09s
  const stepSamples = Math.floor(T_st * stepRatio * sampleRate);

  const numBlocks = Math.floor(Math.round((totalSamples - blockSamples) / (T_st * stepRatio * sampleRate))) + 1;
  if (numBlocks <= 0) {
    return {
      loudnessRangeLu: null,
      shortTermPoints: [],
      shortTermMaxLufs: null,
      shortTermMinLufs: null
    };
  }

  // 2. Compute 3-second block loudness values
  const blockLoudnessValues: number[] = [];
  const timelinePoints: ShortTermPoint[] = [];

  let maxShortTerm = -100.0;
  let maxShortTermTime: number | null = null;
  let minShortTerm = 100.0;

  for (let j = 0; j < numBlocks; j++) {
    const l = j * stepSamples;
    const u = l + blockSamples;

    let sumWeighted = 0.0;

    for (let c = 0; c < numChannels; c++) {
      const data = filteredChannels[c];
      let sumSq = 0.0;

      const validEnd = Math.min(u, numSamples);
      const validStart = Math.min(l, numSamples);

      for (let s = validStart; s < validEnd; s++) {
        const val = data[s];
        sumSq += val * val;
      }

      const meanSq = sumSq / blockSamples;
      sumWeighted += G[c] * meanSq;
    }

    let blockLufs = -100.0;
    if (sumWeighted > 1e-12) {
      blockLufs = -0.691 + 10.0 * Math.log10(sumWeighted);
    }

    blockLoudnessValues.push(blockLufs);

    // Track short term max and min across all sliding positions fully within audio
    if (u <= numSamples) {
      if (blockLufs > maxShortTerm) {
        maxShortTerm = blockLufs;
        maxShortTermTime = l / sampleRate;
      }
      if (blockLufs < minShortTerm && blockLufs > -70.0) minShortTerm = blockLufs;
    }

    // Record timeline point every 1.0s (every 10th block)
    if (j % 10 === 0 && l < numSamples) {
      const timeSec = Math.round((l / sampleRate) * 10) / 10;
      if (blockLufs > -70.0) {
        timelinePoints.push({
          timeSeconds: timeSec,
          loudnessLufs: Math.round(blockLufs * 10) / 10
        });
      }
    }
  }

  // 3. Absolute Gating (Gamma_a = -70.0 LUFS)
  const absGated = blockLoudnessValues.filter(val => val >= -70.0);
  if (absGated.length === 0) {
    return {
      loudnessRangeLu: null,
      shortTermPoints: timelinePoints,
      shortTermMaxLufs: null,
      shortTermMinLufs: null
    };
  }

  // 4. Relative Gating Reference Level (Gamma_r = Integrated_Abs - 20.0 LU)
  let sumPower = 0.0;
  for (let i = 0; i < absGated.length; i++) {
    sumPower += Math.pow(10.0, absGated[i] / 10.0);
  }
  const stlIntegrated = 10.0 * Math.log10(sumPower / absGated.length);
  const Gamma_r = stlIntegrated - 20.0; // -20 LU relative threshold per EBU Tech 3342

  // 5. Apply Relative Gating
  const relGated = absGated.filter(val => val >= Gamma_r);
  if (relGated.length < 2) {
    return {
      loudnessRangeLu: 0.0,
      shortTermPoints: timelinePoints,
      shortTermMaxLufs: maxShortTerm > -100 ? Math.round(maxShortTerm * 100) / 100 : null,
      shortTermMaxTimestampSec: maxShortTermTime,
      shortTermMinLufs: minShortTerm < 100 ? Math.round(minShortTerm * 100) / 100 : null
    };
  }

  // 6. Compute 10th and 95th Percentiles
  relGated.sort((a, b) => a - b);
  const p10 = computePercentile(relGated, 10);
  const p95 = computePercentile(relGated, 95);

  const lraRaw = Math.max(0.0, p95 - p10);
  const loudnessRangeLu = Math.round(lraRaw * 10) / 10;

  return {
    loudnessRangeLu,
    shortTermPoints: timelinePoints,
    shortTermMaxLufs: maxShortTerm > -100 ? Math.round(maxShortTerm * 100) / 100 : null,
    shortTermMaxTimestampSec: maxShortTermTime,
    shortTermMinLufs: minShortTerm < 100 ? Math.round(minShortTerm * 100) / 100 : null
  };
}
