import { LocalAudioMeasurements, WorkerRequest, WorkerResponse } from './types';
import { analyzeWavBuffer } from './analyzer';

export interface LocalAnalysisProgressCallback {
  (stage: string, message: string, percent: number): void;
}

export async function analyzeWavFileLocally(
  file: File,
  onProgress?: LocalAnalysisProgressCallback
): Promise<LocalAudioMeasurements> {
  // If Web Worker is supported in browser
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      return await analyzeWithWorker(file, onProgress);
    } catch (workerErr) {
      console.warn('Worker analysis failed or was blocked; falling back to main thread async DSP:', workerErr);
    }
  }

  // Main thread fallback (in chunks/async)
  if (onProgress) onProgress('READING_FILE', 'Reading audio data into memory...', 10);
  const buffer = await file.arrayBuffer();

  return await analyzeWavBuffer(buffer, file.name, (stage, percent) => {
    if (onProgress) {
      const messages: Record<string, string> = {
        PARSING_WAV: 'Parsing WAV header & PCM audio streams...',
        HASHING_FILE: 'Calculating cryptographic SHA-256 hash...',
        ANALYZING_METRICS: 'Calculating DSP sample peaks, RMS energy, DC offset, clipping & silence...',
        ANALYZING_LUFS: 'Measuring ITU-R BS.1770-4 K-weighted Integrated LUFS...',
        ANALYZING_TRUE_PEAK: 'Calculating 4x oversampled polyphase True Peak (dBTP)...',
        COMPLETE: 'Local analysis complete.'
      };
      onProgress(stage, messages[stage] || stage, percent);
    }
  });
}

function analyzeWithWorker(
  file: File,
  onProgress?: LocalAnalysisProgressCallback
): Promise<LocalAudioMeasurements> {
  return new Promise(async (resolve, reject) => {
    let worker: Worker | null = null;

    try {
      if (onProgress) onProgress('READING_FILE', 'Reading audio file...', 10);
      const buffer = await file.arrayBuffer();

      // Inline worker blob to avoid external asset path issues in Next.js
      const workerCode = `
        self.onmessage = async function(e) {
          const { buffer, filename } = e.data;
          try {
            self.postMessage({ type: 'PROGRESS', stage: 'PARSING_WAV', message: 'Parsing WAV structure...', progressPercent: 15 });
            
            const view = new DataView(buffer);
            const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
            if (riff !== 'RIFF') throw new Error('Invalid WAV file (not RIFF)');
            
            let offset = 12;
            let audioFormat = 1, channels = 2, sampleRate = 44100, bitDepth = 16;
            let dataOffset = 0, dataSize = 0;

            while (offset + 8 <= buffer.byteLength) {
              const chunkId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset+1), view.getUint8(offset+2), view.getUint8(offset+3));
              const chunkSize = view.getUint32(offset + 4, true);

              if (chunkId === 'fmt ') {
                audioFormat = view.getUint16(offset + 8, true);
                channels = view.getUint16(offset + 10, true);
                sampleRate = view.getUint32(offset + 12, true);
                bitDepth = view.getUint16(offset + 22, true);
              } else if (chunkId === 'data') {
                dataOffset = offset + 8;
                dataSize = Math.min(chunkSize, buffer.byteLength - dataOffset);
                break;
              }
              offset += 8 + chunkSize + (chunkSize % 2);
            }

            if (!dataOffset) throw new Error('Missing data chunk in WAV');

            const bytesPerSample = bitDepth / 8;
            const numSamples = Math.floor(dataSize / (channels * bytesPerSample));
            const durationSeconds = Math.round((numSamples / sampleRate) * 1000) / 1000;

            // Extract channel data
            const channelBuffers = [];
            for (let c = 0; c < channels; c++) {
              channelBuffers.push(new Float32Array(numSamples));
            }

            let byteIdx = 0;
            if (bitDepth === 16) {
              const scale = 1.0 / 32768.0;
              for (let i = 0; i < numSamples; i++) {
                for (let c = 0; c < channels; c++) {
                  channelBuffers[c][i] = view.getInt16(dataOffset + byteIdx, true) * scale;
                  byteIdx += 2;
                }
              }
            } else if (bitDepth === 24) {
              const scale = 1.0 / 8388608.0;
              const u8 = new Uint8Array(buffer, dataOffset, dataSize);
              for (let i = 0; i < numSamples; i++) {
                for (let c = 0; c < channels; c++) {
                  const b0 = u8[byteIdx], b1 = u8[byteIdx+1], b2 = u8[byteIdx+2];
                  const raw = (b0 | (b1 << 8) | (b2 << 16)) << 8 >> 8;
                  channelBuffers[c][i] = raw * scale;
                  byteIdx += 3;
                }
              }
            } else if (bitDepth === 32 && audioFormat === 3) {
              for (let i = 0; i < numSamples; i++) {
                for (let c = 0; c < channels; c++) {
                  channelBuffers[c][i] = view.getFloat32(dataOffset + byteIdx, true);
                  byteIdx += 4;
                }
              }
            } else if (bitDepth === 32) {
              const scale = 1.0 / 2147483648.0;
              for (let i = 0; i < numSamples; i++) {
                for (let c = 0; c < channels; c++) {
                  channelBuffers[c][i] = view.getInt32(dataOffset + byteIdx, true) * scale;
                  byteIdx += 4;
                }
              }
            }

            self.postMessage({ type: 'PROGRESS', stage: 'ANALYZING_METRICS', message: 'Analyzing peaks, RMS, DC offset, clipping & silence...', progressPercent: 45 });

            // DSP Metrics calculation
            let globalPeakLinear = 0.0, totalSumSquares = 0.0, totalSumSamples = 0.0;
            let totalClippedSamples = 0, totalClippedRuns = 0, maxConsecutiveClipped = 0;
            const channelMetrics = [];

            for (let c = 0; c < channels; c++) {
              const d = channelBuffers[c];
              let chPeak = 0, chSumSq = 0, chSumSamp = 0, chClipped = 0, run = 0, chRuns = 0;
              for (let i = 0; i < numSamples; i++) {
                const s = d[i];
                const absS = Math.abs(s);
                if (absS > chPeak) chPeak = absS;
                chSumSq += s * s;
                chSumSamp += s;
                if (absS >= 0.9999) {
                  chClipped++;
                  run++;
                  if (run > maxConsecutiveClipped) maxConsecutiveClipped = run;
                } else {
                  if (run >= 3) chRuns++;
                  run = 0;
                }
              }
              if (run >= 3) chRuns++;
              if (chPeak > globalPeakLinear) globalPeakLinear = chPeak;
              totalSumSquares += chSumSq;
              totalSumSamples += chSumSamp;
              totalClippedSamples += chClipped;
              totalClippedRuns += chRuns;

              const chRms = Math.sqrt(chSumSq / numSamples);
              const chDc = chSumSamp / numSamples;
              channelMetrics.push({
                channelIndex: c,
                samplePeakLinear: Math.round(chPeak * 100000) / 100000,
                samplePeakDbfs: chPeak > 1e-6 ? Math.round(20 * Math.log10(chPeak) * 100) / 100 : -100.0,
                rmsLinear: Math.round(chRms * 100000) / 100000,
                rmsDbfs: chRms > 1e-6 ? Math.round(20 * Math.log10(chRms) * 100) / 100 : -100.0,
                dcOffsetLinear: Math.round(chDc * 100000) / 100000,
                dcOffsetPercent: Math.round(chDc * 10000) / 100,
                clippedSamples: chClipped
              });
            }

            const globalRms = Math.sqrt(totalSumSquares / (numSamples * channels));
            const globalDc = totalSumSamples / (numSamples * channels);

            // Silence calculation
            const frameSize = Math.max(1, Math.floor(0.05 * sampleRate));
            const numFrames = Math.floor(numSamples / frameSize);
            const silenceThresh = 0.001; // -60 dBFS
            let leadingSilence = 0, trailingSilence = 0, totalSilence = 0;
            let isSilent = globalPeakLinear < silenceThresh;

            if (!isSilent && numFrames > 0) {
              const active = [];
              for (let f = 0; f < numFrames; f++) {
                let fSq = 0;
                const st = f * frameSize;
                for (let c = 0; c < channels; c++) {
                  for (let i = 0; i < frameSize; i++) {
                    const s = channelBuffers[c][st + i];
                    fSq += s * s;
                  }
                }
                if (Math.sqrt(fSq / (frameSize * channels)) >= silenceThresh) {
                  active.push(f);
                }
              }
              if (active.length > 0) {
                leadingSilence = Math.round(((active[0] * frameSize) / sampleRate) * 1000) / 1000;
                trailingSilence = Math.round((((numFrames - 1 - active[active.length-1]) * frameSize + (numSamples % frameSize)) / sampleRate) * 1000) / 1000;
                totalSilence = Math.round((((numFrames - active.length) * frameSize) / sampleRate) * 1000) / 1000;
              } else {
                isSilent = true;
              }
            }

            // === ITU-R BS.1770-4 LUFS Calculation ===
            self.postMessage({ type: 'PROGRESS', stage: 'ANALYZING_LUFS', message: 'Measuring ITU-R BS.1770-4 Integrated LUFS...', progressPercent: 65 });
            
            // K-weighting filter coefficients
            const G_hs = 4.0, Q_hs = 1.0 / Math.SQRT2, fc_hs = 1500.0;
            const A_hs = Math.pow(10.0, G_hs / 40.0);
            const w0_hs = 2.0 * Math.PI * (fc_hs / sampleRate);
            const alpha_hs = Math.sin(w0_hs) / (2.0 * Q_hs);
            const cos_w0_hs = Math.cos(w0_hs);
            const a0_hs = (A_hs + 1) - (A_hs - 1) * cos_w0_hs + 2 * Math.sqrt(A_hs) * alpha_hs;
            const hs_b0 = (A_hs * ((A_hs + 1) + (A_hs - 1) * cos_w0_hs + 2 * Math.sqrt(A_hs) * alpha_hs)) / a0_hs;
            const hs_b1 = (-2 * A_hs * ((A_hs - 1) + (A_hs + 1) * cos_w0_hs)) / a0_hs;
            const hs_b2 = (A_hs * ((A_hs + 1) + (A_hs - 1) * cos_w0_hs - 2 * Math.sqrt(A_hs) * alpha_hs)) / a0_hs;
            const hs_a1 = (2 * ((A_hs - 1) - (A_hs + 1) * cos_w0_hs)) / a0_hs;
            const hs_a2 = ((A_hs + 1) - (A_hs - 1) * cos_w0_hs - 2 * Math.sqrt(A_hs) * alpha_hs) / a0_hs;

            const fc_hp = 38.0, Q_hp = 0.5;
            const w0_hp = 2.0 * Math.PI * (fc_hp / sampleRate);
            const alpha_hp = Math.sin(w0_hp) / (2.0 * Q_hp);
            const cos_w0_hp = Math.cos(w0_hp);
            const a0_hp = 1.0 + alpha_hp;
            const hp_b0 = ((1.0 + cos_w0_hp) / 2.0) / a0_hp;
            const hp_b1 = (-(1.0 + cos_w0_hp)) / a0_hp;
            const hp_b2 = ((1.0 + cos_w0_hp) / 2.0) / a0_hp;
            const hp_a1 = (-2.0 * cos_w0_hp) / a0_hp;
            const hp_a2 = (1.0 - alpha_hp) / a0_hp;

            const filteredChannels = [];
            for (let c = 0; c < channels; c++) {
              const src = channelBuffers[c];
              const f = new Float32Array(numSamples);
              // Apply High-Shelf
              let d0 = 0, d1 = 0;
              for (let i = 0; i < numSamples; i++) {
                const x = src[i];
                const y = hs_b0 * x + d0;
                d0 = hs_b1 * x - hs_a1 * y + d1;
                d1 = hs_b2 * x - hs_a2 * y;
                f[i] = y;
              }
              // Apply High-Pass RLB
              d0 = 0; d1 = 0;
              for (let i = 0; i < numSamples; i++) {
                const x = f[i];
                const y = hp_b0 * x + d0;
                d0 = hp_b1 * x - hp_a1 * y + d1;
                d1 = hp_b2 * x - hp_a2 * y;
                f[i] = y;
              }
              filteredChannels.push(f);
            }

            // Gating calculation
            const G = channels === 1 ? [1.0] : channels === 2 ? [1.0, 1.0] : new Array(channels).fill(1.0);
            const Tg = 0.4, step = 0.25;
            const numBlocks = Math.floor(Math.round((durationSeconds - Tg) / (Tg * step))) + 1;
            let integratedLufs = -70.0;
            let momentaryMaxLufs = -70.0;

            if (numBlocks > 0) {
              const blockSamples = Math.floor(Tg * sampleRate);
              const z = [];
              for (let c = 0; c < channels; c++) z.push(new Float64Array(numBlocks));
              const blockLoudness = new Float64Array(numBlocks);

              for (let j = 0; j < numBlocks; j++) {
                const l = Math.floor(Tg * (j * step) * sampleRate);
                const u = Math.min(l + blockSamples, numSamples);
                let blockSum = 0.0;
                for (let c = 0; c < channels; c++) {
                  const chData = filteredChannels[c];
                  let sSq = 0;
                  for (let i = l; i < u; i++) sSq += chData[i] * chData[i];
                  const mSq = sSq / (Tg * sampleRate);
                  z[c][j] = mSq;
                  blockSum += G[c] * mSq;
                }
                const bLufs = blockSum > 1e-12 ? -0.691 + 10.0 * Math.log10(blockSum) : -100.0;
                blockLoudness[j] = bLufs;
                if (bLufs > momentaryMaxLufs) momentaryMaxLufs = bLufs;
              }

              // Absolute Gate >= -70 LKFS
              const J_g = [];
              for (let j = 0; j < numBlocks; j++) {
                if (blockLoudness[j] >= -70.0) J_g.push(j);
              }

              if (J_g.length > 0) {
                let absEnergy = 0.0;
                const zAvg = new Float64Array(channels);
                for (let c = 0; c < channels; c++) {
                  let sZ = 0;
                  for (let k = 0; k < J_g.length; k++) sZ += z[c][J_g[k]];
                  zAvg[c] = sZ / J_g.length;
                  absEnergy += G[c] * zAvg[c];
                }
                const Gamma_r = -0.691 + 10.0 * Math.log10(Math.max(1e-12, absEnergy)) - 10.0;
                const J_final = [];
                for (let j = 0; j < numBlocks; j++) {
                  if (blockLoudness[j] > Gamma_r && blockLoudness[j] >= -70.0) J_final.push(j);
                }

                let finalEnergy = 0.0;
                if (J_final.length > 0) {
                  for (let c = 0; c < channels; c++) {
                    let sZ = 0;
                    for (let k = 0; k < J_final.length; k++) sZ += z[c][J_final[k]];
                    finalEnergy += G[c] * (sZ / J_final.length);
                  }
                } else {
                  finalEnergy = absEnergy;
                }
                integratedLufs = finalEnergy > 1e-12 ? Math.round((-0.691 + 10.0 * Math.log10(finalEnergy)) * 100) / 100 : -70.0;
              }
            }

            // === True Peak (4x Polyphase Interpolation) ===
            self.postMessage({ type: 'PROGRESS', stage: 'ANALYZING_TRUE_PEAK', message: 'Calculating 4x oversampled polyphase True Peak (dBTP)...', progressPercent: 85 });
            let maxTruePeak = globalPeakLinear;
            const upFactor = sampleRate > 96000 ? 1 : sampleRate > 48000 ? 2 : 4;

            if (upFactor > 1) {
              // 4x polyphase sinc filter (halfTaps = 12)
              const halfTaps = 12, numTaps = 24;
              for (let c = 0; c < channels; c++) {
                const d = channelBuffers[c];
                for (let i = 0; i < numSamples; i++) {
                  const a0 = Math.abs(d[i]);
                  if (a0 > maxTruePeak) maxTruePeak = a0;
                  if (a0 < maxTruePeak * 0.7 && i > 0 && i < numSamples - 1) {
                    if (Math.abs(d[i-1]) < maxTruePeak * 0.7 && Math.abs(d[i+1]) < maxTruePeak * 0.7) continue;
                  }
                  // Sub-phase sinc interpolation at +0.25, +0.5, +0.75
                  for (let p = 1; p < upFactor; p++) {
                    const offset = p / upFactor;
                    let interp = 0.0;
                    for (let k = 0; k < numTaps; k++) {
                      const idx = i - halfTaps + 1 + k;
                      if (idx >= 0 && idx < numSamples) {
                        const t = (k - halfTaps + 1) - offset;
                        const sinc = Math.abs(t) > 1e-7 ? Math.sin(Math.PI * t) / (Math.PI * t) : 1.0;
                        const kArg = 2.0 * (k - halfTaps + 0.5) / numTaps;
                        const w = Math.abs(kArg) <= 1.0 ? 0.54 - 0.46 * Math.cos(Math.PI * (kArg + 1)) : 0;
                        interp += d[idx] * (sinc * w);
                      }
                    }
                    const absInterp = Math.abs(interp);
                    if (absInterp > maxTruePeak) maxTruePeak = absInterp;
                  }
                }
              }
            }

            const truePeakLinear = Math.round(maxTruePeak * 100000) / 100000;
            const truePeakDbtp = maxTruePeak > 1e-6 ? Math.round(20.0 * Math.log10(maxTruePeak) * 100) / 100 : -100.0;

            // SHA-256
            let sha256 = 'sha256-computed';
            if (self.crypto && self.crypto.subtle) {
              const hashBuf = await self.crypto.subtle.digest('SHA-256', buffer);
              sha256 = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
            }

            const result = {
              filename,
              fileSizeBytes: buffer.byteLength,
              sha256Hash: sha256,
              metadata: {
                format: 'WAV',
                audioFormat,
                audioFormatName: audioFormat === 1 ? 'PCM' : 'IEEE Float',
                channels,
                channelLayout: channels === 1 ? 'Mono' : channels === 2 ? 'Stereo' : channels + ' Channels',
                sampleRate,
                bitDepth,
                byteRate: sampleRate * channels * bytesPerSample,
                blockAlign: channels * bytesPerSample,
                dataChunkOffset: dataOffset,
                dataChunkSize: dataSize,
                numSamples,
                durationSeconds,
                fileSizeBytes: buffer.byteLength,
                sha256Hash: sha256
              },
              integratedLufs: Math.max(-70.0, integratedLufs),
              momentaryMaxLufs: Math.max(-70.0, Math.round(momentaryMaxLufs * 100) / 100),
              shortTermMaxLufs: null,
              loudnessRangeLu: null,
              samplePeakLinear: Math.round(globalPeakLinear * 100000) / 100000,
              samplePeakDbfs: globalPeakLinear > 1e-6 ? Math.round(20 * Math.log10(globalPeakLinear) * 100) / 100 : -100.0,
              truePeakLinear,
              truePeakDbtp,
              isClippingRisk: truePeakDbtp >= -0.1 || globalPeakLinear >= 0.9999,
              rmsLinear: Math.round(globalRms * 100000) / 100000,
              rmsDbfs: globalRms > 1e-6 ? Math.round(20 * Math.log10(globalRms) * 100) / 100 : -100.0,
              dcOffsetLinear: Math.round(globalDc * 100000) / 100000,
              dcOffsetPercent: Math.round(globalDc * 10000) / 100,
              channelMetrics,
              clipping: {
                clippingDetected: totalClippedRuns > 0 || totalClippedSamples >= 10,
                clippedSamples: totalClippedSamples,
                consecutiveClippedRuns: totalClippedRuns,
                maxConsecutiveClipped
              },
              silence: {
                leadingSilenceSec: leadingSilence,
                trailingSilenceSec: trailingSilence,
                totalSilenceSec: totalSilence,
                isCompletelySilent: isSilent,
                excessiveSilenceDetected: leadingSilence > 2.0 || trailingSilence > 5.0
              },
              analysisDurationMs: 0
            };

            self.postMessage({ type: 'SUCCESS', result });
          } catch (err) {
            self.postMessage({ type: 'ERROR', error: err.message || 'Worker analysis failed' });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.type === 'PROGRESS') {
          if (onProgress) onProgress(msg.stage, msg.message, msg.progressPercent);
        } else if (msg.type === 'SUCCESS') {
          if (worker) worker.terminate();
          URL.revokeObjectURL(blobUrl);
          resolve(msg.result);
        } else if (msg.type === 'ERROR') {
          if (worker) worker.terminate();
          URL.revokeObjectURL(blobUrl);
          reject(new Error(msg.error));
        }
      };

      worker.onerror = (err) => {
        if (worker) worker.terminate();
        URL.revokeObjectURL(blobUrl);
        reject(new Error(err.message || 'Worker thread encountered an unhandled error.'));
      };

      // Send buffer with transferable ownership
      worker.postMessage({ buffer, filename: file.name }, [buffer]);
    } catch (err) {
      if (worker) worker.terminate();
      reject(err);
    }
  });
}
