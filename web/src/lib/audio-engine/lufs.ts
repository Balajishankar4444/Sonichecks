/**
 * ITU-R BS.1770-4 Loudness Measurement Engine
 * Exactly reproduces pyloudnorm / ITU-R BS.1770-4 K-weighting, 400ms blocks, 75% overlap,
 * absolute gating (-70 LKFS) and relative gating (-10 LU).
 */

export interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export interface LoudnessMeasurements {
  integratedLufs: number;
  momentaryMaxLufs: number | null;
  shortTermMaxLufs: number | null;
  loudnessRangeLu: number | null;
}

/**
 * Generate K-weighting filter coefficients matching pyloudnorm / BS.1770-4 RBJ design.
 */
export function generateKWeightingFilters(sampleRate: number): {
  highShelf: BiquadCoeffs;
  highPass: BiquadCoeffs;
} {
  // 1. Stage 1: High-Shelf Filter (G = 4.0 dB, Q = 1/sqrt(2), fc = 1500.0 Hz)
  const G = 4.0;
  const Q_hs = 1.0 / Math.SQRT2;
  const fc_hs = 1500.0;
  const A = Math.pow(10.0, G / 40.0);
  const w0_hs = 2.0 * Math.PI * (fc_hs / sampleRate);
  const alpha_hs = Math.sin(w0_hs) / (2.0 * Q_hs);
  const cos_w0_hs = Math.cos(w0_hs);

  const b0_hs_raw = A * ((A + 1) + (A - 1) * cos_w0_hs + 2 * Math.sqrt(A) * alpha_hs);
  const b1_hs_raw = -2 * A * ((A - 1) + (A + 1) * cos_w0_hs);
  const b2_hs_raw = A * ((A + 1) + (A - 1) * cos_w0_hs - 2 * Math.sqrt(A) * alpha_hs);
  const a0_hs = (A + 1) - (A - 1) * cos_w0_hs + 2 * Math.sqrt(A) * alpha_hs;
  const a1_hs_raw = 2 * ((A - 1) - (A + 1) * cos_w0_hs);
  const a2_hs_raw = (A + 1) - (A - 1) * cos_w0_hs - 2 * Math.sqrt(A) * alpha_hs;

  const highShelf: BiquadCoeffs = {
    b0: b0_hs_raw / a0_hs,
    b1: b1_hs_raw / a0_hs,
    b2: b2_hs_raw / a0_hs,
    a1: a1_hs_raw / a0_hs,
    a2: a2_hs_raw / a0_hs
  };

  // 2. Stage 2: High-Pass RLB Filter (G = 0.0 dB, Q = 0.5, fc = 38.0 Hz)
  const Q_hp = 0.5;
  const fc_hp = 38.0;
  const w0_hp = 2.0 * Math.PI * (fc_hp / sampleRate);
  const alpha_hp = Math.sin(w0_hp) / (2.0 * Q_hp);
  const cos_w0_hp = Math.cos(w0_hp);

  const b0_hp_raw = (1.0 + cos_w0_hp) / 2.0;
  const b1_hp_raw = -(1.0 + cos_w0_hp);
  const b2_hp_raw = (1.0 + cos_w0_hp) / 2.0;
  const a0_hp = 1.0 + alpha_hp;
  const a1_hp_raw = -2.0 * cos_w0_hp;
  const a2_hp_raw = 1.0 - alpha_hp;

  const highPass: BiquadCoeffs = {
    b0: b0_hp_raw / a0_hp,
    b1: b1_hp_raw / a0_hp,
    b2: b2_hp_raw / a0_hp,
    a1: a1_hp_raw / a0_hp,
    a2: a2_hp_raw / a0_hp
  };

  return { highShelf, highPass };
}

/**
 * Direct Form II Transposed IIR filter implementation (equivalent to scipy.signal.lfilter).
 */
export function applyIirFilterInPlace(data: Float32Array, coeffs: BiquadCoeffs): void {
  const { b0, b1, b2, a1, a2 } = coeffs;
  let d0 = 0.0;
  let d1 = 0.0;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    const y = b0 * x + d0;
    d0 = b1 * x - a1 * y + d1;
    d1 = b2 * x - a2 * y;
    data[i] = y;
  }
}

/**
 * Filter audio channel using two-stage K-weighting cascade (High-shelf then High-pass).
 */
export function applyKWeighting(
  channels: Float32Array[],
  sampleRate: number
): Float32Array[] {
  const { highShelf, highPass } = generateKWeightingFilters(sampleRate);
  const filteredChannels: Float32Array[] = [];

  for (let ch = 0; ch < channels.length; ch++) {
    // Clone channel data so original is not mutated
    const chData = new Float32Array(channels[ch]);
    applyIirFilterInPlace(chData, highShelf);
    applyIirFilterInPlace(chData, highPass);
    filteredChannels.push(chData);
  }

  return filteredChannels;
}

/**
 * Get ITU channel weighting factors Gi (BS.1770-4 Table 1).
 */
function getChannelWeightings(numChannels: number): number[] {
  if (numChannels === 1) return [1.0];
  if (numChannels === 2) return [1.0, 1.0];
  if (numChannels === 5 || numChannels === 6) {
    // L, R, C, Ls, Rs (and LFE if 6)
    return [1.0, 1.0, 1.0, 1.41, 1.41, 0.0];
  }
  // Default equal weighting
  return new Array(numChannels).fill(1.0);
}

/**
 * Calculate ITU-R BS.1770-4 Integrated LUFS, Momentary Max, and Short-term Max.
 */
export function calculateLoudness(
  channels: Float32Array[],
  sampleRate: number
): LoudnessMeasurements {
  const numChannels = channels.length;
  if (numChannels === 0 || channels[0].length === 0) {
    return {
      integratedLufs: -70.0,
      momentaryMaxLufs: -70.0,
      shortTermMaxLufs: -70.0,
      loudnessRangeLu: 0.0
    };
  }

  const numSamples = channels[0].length;
  const duration = numSamples / sampleRate;

  if (duration < 0.1) {
    return {
      integratedLufs: -70.0,
      momentaryMaxLufs: -70.0,
      shortTermMaxLufs: -70.0,
      loudnessRangeLu: 0.0
    };
  }

  // 1. Apply K-weighting filters
  const filtered = applyKWeighting(channels, sampleRate);
  const G = getChannelWeightings(numChannels);

  // 2. Gating Parameters
  const Tg = 0.4; // 400ms block duration
  const overlap = 0.75; // 75% overlap
  const step = 1.0 - overlap; // 25% step (100ms)
  const Gamma_a = -70.0; // Absolute loudness threshold (-70 LKFS)

  const numBlocks = Math.floor(Math.round((duration - Tg) / (Tg * step))) + 1;

  if (numBlocks <= 0) {
    // Duration is shorter than 400ms, compute direct un-gated loudness
    let sumWeightedSquares = 0.0;
    for (let ch = 0; ch < numChannels; ch++) {
      let sumSq = 0.0;
      const chData = filtered[ch];
      for (let i = 0; i < numSamples; i++) {
        sumSq += chData[i] * chData[i];
      }
      sumWeightedSquares += G[ch] * (sumSq / numSamples);
    }
    const rawLufs = sumWeightedSquares > 1e-12 
      ? -0.691 + 10.0 * Math.log10(sumWeightedSquares)
      : -70.0;
    const lufsVal = Math.max(-70.0, Math.round(rawLufs * 100) / 100);

    return {
      integratedLufs: lufsVal,
      momentaryMaxLufs: lufsVal,
      shortTermMaxLufs: lufsVal,
      loudnessRangeLu: 0.0
    };
  }

  // 3. Compute mean square energy z[i, j] for each channel and block
  const blockSamples = Math.floor(Tg * sampleRate);
  const z: Float64Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    z.push(new Float64Array(numBlocks));
  }

  const blockLoudness = new Float64Array(numBlocks);

  for (let j = 0; j < numBlocks; j++) {
    const l = Math.floor(Tg * (j * step) * sampleRate);
    const u = Math.min(l + blockSamples, numSamples);
    const actualLen = u - l;
    if (actualLen <= 0) continue;

    let blockSumWeighted = 0.0;

    for (let ch = 0; ch < numChannels; ch++) {
      const chData = filtered[ch];
      let sumSq = 0.0;
      for (let i = l; i < u; i++) {
        sumSq += chData[i] * chData[i];
      }
      const meanSq = sumSq / (Tg * sampleRate);
      z[ch][j] = meanSq;
      blockSumWeighted += G[ch] * meanSq;
    }

    if (blockSumWeighted > 1e-12) {
      blockLoudness[j] = -0.691 + 10.0 * Math.log10(blockSumWeighted);
    } else {
      blockLoudness[j] = -100.0;
    }
  }

  // 4. Absolute Gating (>= -70.0 LKFS)
  const J_g: number[] = [];
  for (let j = 0; j < numBlocks; j++) {
    if (blockLoudness[j] >= Gamma_a) {
      J_g.push(j);
    }
  }

  if (J_g.length === 0) {
    return {
      integratedLufs: -70.0,
      momentaryMaxLufs: -70.0,
      shortTermMaxLufs: -70.0,
      loudnessRangeLu: 0.0
    };
  }

  // Calculate average energy of absolute-gated blocks
  const z_avg_gated = new Float64Array(numChannels);
  let absGatedWeightedEnergy = 0.0;
  for (let ch = 0; ch < numChannels; ch++) {
    let sumZ = 0.0;
    for (let k = 0; k < J_g.length; k++) {
      sumZ += z[ch][J_g[k]];
    }
    z_avg_gated[ch] = sumZ / J_g.length;
    absGatedWeightedEnergy += G[ch] * z_avg_gated[ch];
  }

  // 5. Relative Gating Threshold (Gamma_r = Integrated_Abs - 10.0 LU)
  const Gamma_r = -0.691 + 10.0 * Math.log10(Math.max(1e-12, absGatedWeightedEnergy)) - 10.0;

  // 6. Relative + Absolute Gated Blocks
  const J_final: number[] = [];
  for (let j = 0; j < numBlocks; j++) {
    if (blockLoudness[j] > Gamma_r && blockLoudness[j] >= Gamma_a) {
      J_final.push(j);
    }
  }

  let finalWeightedEnergy = 0.0;
  if (J_final.length > 0) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sumZ = 0.0;
      for (let k = 0; k < J_final.length; k++) {
        sumZ += z[ch][J_final[k]];
      }
      finalWeightedEnergy += G[ch] * (sumZ / J_final.length);
    }
  } else {
    finalWeightedEnergy = absGatedWeightedEnergy;
  }

  const finalLufsRaw = finalWeightedEnergy > 1e-12
    ? -0.691 + 10.0 * Math.log10(finalWeightedEnergy)
    : -70.0;

  const integratedLufs = Math.max(-70.0, Math.round(finalLufsRaw * 100) / 100);

  // 7. Momentary Max LUFS (Maximum of 400ms blocks)
  let momentaryMax = -70.0;
  for (let j = 0; j < numBlocks; j++) {
    if (blockLoudness[j] > momentaryMax) {
      momentaryMax = blockLoudness[j];
    }
  }
  const momentaryMaxLufs = Math.max(-70.0, Math.round(momentaryMax * 100) / 100);

  // 8. Short-term Max LUFS (3.0s window with 1.0s step)
  let shortTermMaxLufs: number | null = null;
  const stWinSamples = Math.floor(3.0 * sampleRate);
  const stStepSamples = Math.floor(1.0 * sampleRate);

  if (numSamples >= stWinSamples && stStepSamples > 0) {
    let maxSt = -70.0;
    const stValues: number[] = [];

    for (let i = 0; i <= numSamples - stWinSamples; i += stStepSamples) {
      let stWeightedSum = 0.0;
      for (let ch = 0; ch < numChannels; ch++) {
        const chData = filtered[ch];
        let sumSq = 0.0;
        for (let s = 0; s < stWinSamples; s++) {
          const val = chData[i + s];
          sumSq += val * val;
        }
        stWeightedSum += G[ch] * (sumSq / stWinSamples);
      }
      if (stWeightedSum > 1e-12) {
        const stLufs = -0.691 + 10.0 * Math.log10(stWeightedSum);
        stValues.push(stLufs);
        if (stLufs > maxSt) maxSt = stLufs;
      }
    }

    if (stValues.length > 0) {
      shortTermMaxLufs = Math.max(-70.0, Math.round(maxSt * 100) / 100);
    }
  }

  return {
    integratedLufs,
    momentaryMaxLufs,
    shortTermMaxLufs,
    loudnessRangeLu: null
  };
}
