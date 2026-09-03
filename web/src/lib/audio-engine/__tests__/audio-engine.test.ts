import { parseWavHeader, parseWavAudioData } from '../wav-parser';
import { calculateDspMetrics } from '../dsp-metrics';
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
  console.log('🧪 Running Browser Audio Engine Test Suite...\n');

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
    assertClose(meta.durationSeconds, 1.0, 0.01, 'Duration should be 1.0s');

    const result = await analyzeWavBuffer(wav, 'sine_16bit_44k.wav');
    assertClose(result.samplePeakLinear, 0.5, 0.001, 'Sample peak linear should be ~0.5');
    assertClose(result.samplePeakDbfs, -6.02, 0.1, 'Sample peak dBFS should be ~ -6.02 dBFS');
    // Sine RMS is peak / sqrt(2) = 0.5 / 1.414 = 0.3535 -> ~ -9.03 dBFS
    assertClose(result.rmsLinear, 0.3535, 0.005, 'RMS linear should be ~0.3535');
    assertClose(result.rmsDbfs, -9.03, 0.1, 'RMS dBFS should be ~ -9.03 dBFS');
    assert(!result.clipping.clippingDetected, 'Should not detect clipping on clean sine');
    assert(!result.silence.isCompletelySilent, 'Should not be silent');
    console.log('  ✅ Test 1: 16-bit 44.1kHz Stereo Sine Wave analysis passed');
  }

  // Test 2: Valid 24-bit 48kHz Stereo Sine Wave
  {
    const wav = createSyntheticWav({
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      durationSeconds: 2.0,
      generator: (t) => 0.188 * Math.sin(2 * Math.PI * 440 * t) // same as Python fixture
    });

    const result = await analyzeWavBuffer(wav, 'sine_24bit_48k.wav');
    assert(result.metadata.sampleRate === 48000, 'Sample rate must be 48000');
    assert(result.metadata.bitDepth === 24, 'Bit depth must be 24');
    assertClose(result.samplePeakLinear, 0.188, 0.001, 'Sample peak linear should be ~0.188');
    assertClose(result.samplePeakDbfs, -14.52, 0.1, 'Sample peak dBFS should match Python fixture');
    console.log('  ✅ Test 2: 24-bit 48kHz Stereo Sine Wave analysis passed');
  }

  // Test 3: Valid 32-bit 96kHz Mono Signal
  {
    const wav = createSyntheticWav({
      sampleRate: 96000,
      channels: 1,
      bitDepth: 32,
      durationSeconds: 0.5,
      generator: (t) => 0.75 * Math.sin(2 * Math.PI * 1000 * t)
    });

    const result = await analyzeWavBuffer(wav, 'sine_32bit_96k_mono.wav');
    assert(result.metadata.channels === 1, 'Channel count must be 1 (Mono)');
    assert(result.metadata.sampleRate === 96000, 'Sample rate must be 96000');
    assert(result.metadata.bitDepth === 32, 'Bit depth must be 32');
    assertClose(result.samplePeakLinear, 0.75, 0.001, 'Sample peak linear should be ~0.75');
    console.log('  ✅ Test 3: 32-bit 96kHz Mono Signal analysis passed');
  }

  // Test 4: DC Offset and Constant Signal Detection
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      durationSeconds: 0.5,
      generator: () => 0.10 // Constant 10% DC offset
    });

    const result = await analyzeWavBuffer(wav, 'dc_offset.wav');
    assertClose(result.dcOffsetLinear, 0.10, 0.001, 'DC offset linear should be ~0.10');
    assertClose(result.dcOffsetPercent, 10.0, 0.1, 'DC offset percent should be ~10.0%');
    console.log('  ✅ Test 4: DC Offset & Constant Signal analysis passed');
  }

  // Test 5: Hard Digital Clipping Detection
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 1.0,
      // Creates clipped flat-topped runs hitting 1.0
      generator: (t) => {
        const raw = 1.8 * Math.sin(2 * Math.PI * 200 * t);
        return Math.max(-1.0, Math.min(1.0, raw));
      }
    });

    const result = await analyzeWavBuffer(wav, 'clipped.wav');
    assert(result.clipping.clippingDetected, 'Should detect hard clipping');
    assert(result.clipping.clippedSamples > 100, 'Should count clipped samples');
    assert(result.clipping.consecutiveClippedRuns > 0, 'Should detect consecutive clipped runs');
    assertClose(result.samplePeakLinear, 1.0, 0.001, 'Peak linear should be 1.0');
    assertClose(result.samplePeakDbfs, 0.0, 0.05, 'Peak dBFS should be 0.0 dBFS');
    console.log('  ✅ Test 5: Hard Digital Clipping detection passed');
  }

  // Test 6: Silence Detection with Leading & Trailing Silence
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 3.0,
      generator: (t) => {
        // 0.5s leading silence, 1.0s audio, 1.5s trailing silence
        if (t < 0.5 || t > 1.5) return 0.0;
        return 0.3 * Math.sin(2 * Math.PI * 1000 * t);
      }
    });

    const result = await analyzeWavBuffer(wav, 'padded_silence.wav');
    assert(!result.silence.isCompletelySilent, 'Should not be completely silent');
    assertClose(result.silence.leadingSilenceSec, 0.5, 0.1, 'Leading silence should be ~0.5s');
    assertClose(result.silence.trailingSilenceSec, 1.5, 0.1, 'Trailing silence should be ~1.5s');
    console.log('  ✅ Test 6: Head/Tail Silence boundaries analysis passed');
  }

  // Test 7: Completely Silent File
  {
    const wav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 2.0,
      generator: () => 0.0
    });

    const result = await analyzeWavBuffer(wav, 'completely_silent.wav');
    assert(result.silence.isCompletelySilent, 'Should detect completely silent file');
    assert(result.samplePeakDbfs <= -100.0, 'Peak dBFS should be floor (-100 dBFS)');
    assert(result.rmsDbfs <= -100.0, 'RMS dBFS should be floor (-100 dBFS)');
    console.log('  ✅ Test 7: Completely Silent File detection passed');
  }

  // Test 8: Malformed / Invalid WAV handling
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
    console.log('  ✅ Test 8: Malformed/Invalid WAV graceful rejection passed');
  }

  console.log('\n🎉 ALL 8 BROWSER AUDIO ENGINE TESTS PASSED!\n');
}

// Auto-run if executed in Node.js
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('audio-engine.test')) {
  runAllBrowserEngineTests().catch((err) => {
    console.error('❌ Test failure:', err);
    process.exit(1);
  });
}
