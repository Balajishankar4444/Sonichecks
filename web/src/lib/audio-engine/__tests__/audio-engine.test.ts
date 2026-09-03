import { parseWavHeader, parseWavAudioData } from '../wav-parser';
import { calculateDspMetrics } from '../dsp-metrics';
import { calculateLoudness } from '../lufs';
import { calculateLoudnessRange } from '../lra';
import { calculateTruePeak } from '../true-peak';
import { analyzeWavBuffer } from '../analyzer';
import { createSyntheticWav } from './wav-generator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message: string) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`Assertion failed: ${message} (Actual: ${actual}, Expected: ${expected}, Diff: ${diff} > ${tolerance})`);
  }
}

export async function runAllBrowserEngineTests() {
  console.log('🧪 Running Browser Audio Engine Test Suite (Phase 3.1: DSP + LUFS + True Peak + LRA)...\n');

  // Test 1: Valid 16-bit 44.1kHz Stereo Sine Wave
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 1.0,
      generator: (t) => 0.5 * Math.sin(2 * Math.PI * 440 * t)
    });

    const meta = parseWavHeader(wav);
    assert(meta.sampleRate === 44100, 'Sample rate should be 44100');
    assert(meta.channels === 2, 'Channel count should be 2');
    assert(meta.bitDepth === 16, 'Bit depth should be 16');

    const result = await analyzeWavBuffer(wav, 'sine_16bit_44k.wav');
    assertClose(result.samplePeakLinear, 0.5, 0.001, 'Sample peak linear should be ~0.5');
    assertClose(result.samplePeakDbfs, -6.02, 0.1, 'Sample peak dBFS should be ~ -6.02 dBFS');
    assertClose(result.truePeakDbtp, -6.02, 0.1, 'True Peak dBTP should match sample peak on 440Hz sine');
    assertClose(result.rmsDbfs, -9.03, 0.1, 'RMS dBFS should be ~ -9.03 dBFS');
    assert(!result.clipping.clippingDetected, 'Should not detect clipping on clean sine');
    console.log('  ✅ Test 1: 16-bit 44.1kHz Stereo Sine Wave analysis passed');
  }

  // Test 2: ITU-R BS.1770-4 -15.24 LUFS Stereo Reference (48kHz, 24-bit, 4.0s, Constant Sine LRA ~ 0 LU)
  {
    const wav = createSyntheticWav({
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      durationSeconds: 4.0,
      generator: (t) => 0.188 * Math.sin(2 * Math.PI * 440 * t)
    });

    const result = await analyzeWavBuffer(wav, 'sine_24bit_48k.wav');
    assert(result.metadata.sampleRate === 48000, 'Sample rate must be 48000');
    assert(result.metadata.bitDepth === 24, 'Bit depth must be 24');
    assertClose(result.integratedLufs, -15.24, 0.05, 'Integrated LUFS should match Python reference (-15.24 LUFS)');
    assertClose(result.samplePeakDbfs, -14.52, 0.05, 'Sample Peak dBFS should match Python reference (-14.52 dBFS)');
    assertClose(result.loudnessRangeLu ?? 0, 2.1, 0.5, 'Constant sine LRA with trailing decay should match Python reference (~2.1 LU)');
    console.log('  ✅ Test 2: ITU-R BS.1770-4 -15.24 LUFS Stereo Reference & LRA passed');
  }

  // Test 3: EBU R128 -22.34 LUFS Broadcast Reference (48kHz, 24-bit, 4.0s)
  {
    const amp23 = Math.pow(10, (-23.0 + 0.691) / 20.0);
    const wav = createSyntheticWav({
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      durationSeconds: 4.0,
      generator: (t) => amp23 * Math.sin(2 * Math.PI * 1000 * t)
    });

    const result = await analyzeWavBuffer(wav, 'broadcast_23lufs.wav');
    assertClose(result.integratedLufs, -22.34, 0.05, 'Integrated LUFS should match Python reference (-22.34 LUFS)');
    console.log('  ✅ Test 3: EBU R128 -22.34 LUFS Broadcast Reference passed');
  }

  // Test 4: EBU Tech 3342 Dynamic Audio LRA Measurement (10.0s, envelope modulation)
  {
    const wav = createSyntheticWav({
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      durationSeconds: 10.0,
      generator: (t) => {
        const env = 0.5 * (1.0 + Math.sin(2 * Math.PI * 0.2 * t));
        return env * (0.3 * Math.sin(2 * Math.PI * 150 * t) + 0.2 * Math.sin(2 * Math.PI * 1200 * t));
      }
    });

    const result = await analyzeWavBuffer(wav, 'dynamic_music_10s.wav');
    assert(result.loudnessRangeLu !== null, 'LRA must be calculated on 10s audio');
    assertClose(result.loudnessRangeLu ?? 0, 12.1, 0.5, 'LRA should measure wide dynamic range (~12.1 LU)');
    console.log('  ✅ Test 4: EBU Tech 3342 Dynamic Audio LRA Measurement passed');
  }

  // Test 5: Short File (< 3.0s) LRA Availability (Should return null/NA per EBU Tech 3342)
  {
    const wav = createSyntheticWav({
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      durationSeconds: 1.5,
      generator: (t) => 0.2 * Math.sin(2 * Math.PI * 440 * t)
    });

    const result = await analyzeWavBuffer(wav, 'short_file_1.5s.wav');
    assert(result.loudnessRangeLu === null, 'LRA must be null for files < 3.0 seconds');
    console.log('  ✅ Test 5: Short File (< 3.0s) LRA returns null (N/A) passed');
  }

  // Test 6: 4x Polyphase Inter-Sample Peak Detection (True Peak > Sample Peak)
  {
    const wav = createSyntheticWav({
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      durationSeconds: 1.0,
      generator: (t) => 1.0 * Math.sin(2 * Math.PI * 12000 * t + Math.PI / 4)
    });

    const result = await analyzeWavBuffer(wav, 'intersample_peak.wav');
    assertClose(result.samplePeakDbfs, -3.01, 0.05, 'Sample peak is -3.01 dBFS');
    assert(result.truePeakDbtp > result.samplePeakDbfs + 2.5, 'True peak must detect inter-sample overshoots');
    assertClose(result.truePeakDbtp, 0.10, 0.15, 'True peak should measure inter-sample peak near 0.1 dBTP');
    console.log('  ✅ Test 6: 4x Polyphase Inter-Sample Peak Detection passed');
  }

  // Test 7: 32-bit 96kHz High-Resolution Audio
  {
    const wav = createSyntheticWav({
      sampleRate: 96000,
      channels: 1,
      bitDepth: 32,
      durationSeconds: 0.5,
      generator: (t) => 0.75 * Math.sin(2 * Math.PI * 1000 * t)
    });

    const result = await analyzeWavBuffer(wav, 'highres_96k_mono.wav');
    assert(result.metadata.channels === 1, 'Channel count must be 1 (Mono)');
    assert(result.metadata.sampleRate === 96000, 'Sample rate must be 96000');
    assert(result.metadata.bitDepth === 32, 'Bit depth must be 32');
    assertClose(result.samplePeakLinear, 0.75, 0.001, 'Sample peak linear should be ~0.75');
    console.log('  ✅ Test 7: 32-bit 96kHz High-Resolution Audio analysis passed');
  }

  // Test 8: DC Offset and Constant Signal Detection
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      durationSeconds: 0.5,
      generator: () => 0.10
    });

    const result = await analyzeWavBuffer(wav, 'dc_offset.wav');
    assertClose(result.dcOffsetLinear, 0.10, 0.001, 'DC offset linear should be ~0.10');
    assertClose(result.dcOffsetPercent, 10.0, 0.1, 'DC offset percent should be ~10.0%');
    console.log('  ✅ Test 8: DC Offset & Constant Signal analysis passed');
  }

  // Test 9: Hard Digital Clipping Detection
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 1.0,
      generator: (t) => {
        const raw = 1.8 * Math.sin(2 * Math.PI * 200 * t);
        return Math.max(-1.0, Math.min(1.0, raw));
      }
    });

    const result = await analyzeWavBuffer(wav, 'clipped.wav');
    assert(result.clipping.clippingDetected, 'Should detect hard clipping');
    assert(result.clipping.clippedSamples > 100, 'Should count clipped samples');
    assert(result.clipping.consecutiveClippedRuns > 0, 'Should detect consecutive clipped runs');
    console.log('  ✅ Test 9: Hard Digital Clipping detection passed');
  }

  // Test 10: Completely Silent File Gating (-70.0 LUFS, LRA null)
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 4.0,
      generator: () => 0.0
    });

    const result = await analyzeWavBuffer(wav, 'completely_silent.wav');
    assert(result.silence.isCompletelySilent, 'Should detect completely silent file');
    assert(result.integratedLufs <= -70.0, 'Silent file LUFS should be gated to -70.0 LUFS');
    assert(result.loudnessRangeLu === null, 'Silent file LRA should be null (not misleading 0 LU)');
    console.log('  ✅ Test 10: Completely Silent File & LRA Gating passed');
  }

  // Test 11: Non-WAV / Malformed error handling
  {
    let caught = false;
    try {
      const invalidBuffer = new ArrayBuffer(20);
      parseWavHeader(invalidBuffer);
    } catch (e: any) {
      caught = true;
      assert(e.message.includes('too small') || e.message.includes('Invalid WAV'), 'Proper error message on bad WAV');
    }
    assert(caught, 'Should reject invalid buffer');
    console.log('  ✅ Test 11: Malformed/Invalid WAV graceful rejection passed');
  }

  console.log('\n🎉 ALL 11 PHASE 3.1 BROWSER AUDIO ENGINE TESTS PASSED!\n');
}

// Auto-run if executed in Node.js
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('audio-engine.test')) {
  runAllBrowserEngineTests().catch((err) => {
    console.error('❌ Test failure:', err);
    process.exit(1);
  });
}
