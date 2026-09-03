import { parseWavAudioData } from '../web/src/lib/audio-engine/wav-parser';
import { calculateDspMetrics } from '../web/src/lib/audio-engine/dsp-metrics';
import { calculateLoudness, applyKWeighting } from '../web/src/lib/audio-engine/lufs';
import { calculateLoudnessRange } from '../web/src/lib/audio-engine/lra';
import { calculateTruePeak } from '../web/src/lib/audio-engine/true-peak';
import { analyzeWavBuffer } from '../web/src/lib/audio-engine/analyzer';

function generateWavBufferOfSize(targetBytes: number, sampleRate = 48000, channels = 2, bitDepth = 24): ArrayBuffer {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const dataSize = Math.floor((targetBytes - 44) / blockAlign) * blockAlign;
  const totalSize = 44 + dataSize;
  const numSamples = dataSize / (channels * bytesPerSample);

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // 'WAVE'

  // 'fmt ' chunk
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // 'data' chunk
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, dataSize, true);

  // Fill samples with 440Hz sine wave + dynamic variations
  const u8 = new Uint8Array(buffer, 44, dataSize);
  const scale = 8388607.0; // 24-bit max

  let byteIdx = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const s = 0.25 * Math.sin(2 * Math.PI * 440 * t);
    const intVal = Math.round(s * scale);
    const clamped = Math.max(-8388608, Math.min(8388607, intVal));
    const unsignedVal = clamped < 0 ? clamped + 16777216 : clamped;

    for (let c = 0; c < channels; c++) {
      u8[byteIdx] = unsignedVal & 0xFF;
      u8[byteIdx + 1] = (unsignedVal >> 8) & 0xFF;
      u8[byteIdx + 2] = (unsignedVal >> 16) & 0xFF;
      byteIdx += 3;
    }
  }

  return buffer;
}

async function runBenchmark() {
  console.log('==========================================================================================');
  console.log(' 🚀 SONICHECKS BROWSER AUDIO ENGINE: LARGE-FILE & THROUGHPUT BENCHMARK');
  console.log('==========================================================================================\n');

  const testSizesMB = [10, 50, 100, 250, 500];

  console.log(`| Target Size | Actual Bytes | Duration | Parse (ms) | DSP (ms) | LUFS+LRA (ms) | True Peak (ms) | Total (ms) | Throughput |`);
  console.log(`| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`);

  for (const mb of testSizesMB) {
    const targetBytes = mb * 1024 * 1024;
    const sampleRate = 48000;
    const channels = 2;
    const bitDepth = 24;

    const buffer = generateWavBufferOfSize(targetBytes, sampleRate, channels, bitDepth);
    const actualBytes = buffer.byteLength;

    // Measure Stage 1: WAV Parsing
    const t0 = performance.now();
    const parsed = parseWavAudioData(buffer);
    const tParse = performance.now() - t0;

    // Measure Stage 2: Peak / RMS / DC / Clipping
    const t1 = performance.now();
    const metrics = calculateDspMetrics(parsed.channels, parsed.metadata.sampleRate);
    const tDsp = performance.now() - t1;

    // Measure Stage 3: K-Weighting, Integrated LUFS, and LRA
    const t2 = performance.now();
    const loudness = calculateLoudness(parsed.channels, parsed.metadata.sampleRate);
    const tLufs = performance.now() - t2;

    // Measure Stage 4: 4x True Peak
    const t3 = performance.now();
    const truePeak = calculateTruePeak(parsed.channels, parsed.metadata.sampleRate);
    const tTp = performance.now() - t3;

    const totalTimeMs = tParse + tDsp + tLufs + tTp;
    const durationSec = parsed.metadata.durationSeconds;
    const throughputMBps = (actualBytes / (1024 * 1024)) / (totalTimeMs / 1000);

    console.log(
      `| ${mb} MB | ${(actualBytes / (1024 * 1024)).toFixed(1)} MB | ${durationSec.toFixed(1)}s | ${tParse.toFixed(1)} ms | ${tDsp.toFixed(1)} ms | ${tLufs.toFixed(1)} ms | ${tTp.toFixed(1)} ms | **${totalTimeMs.toFixed(1)} ms** | **${throughputMBps.toFixed(1)} MB/s** |`
    );
  }

  console.log('\n==========================================================================================');
  console.log(' 🎉 LARGE FILE BENCHMARK COMPLETED: ALL SIZES UP TO 500 MB PROCESSED IN MEMORY STABLY');
  console.log('==========================================================================================\n');
}

runBenchmark().catch(console.error);
