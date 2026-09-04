import { analyzeWavBuffer } from '../analyzer';
import { convertLocalMeasurementsToFileQCResult } from '../adapter';
import { VERIFIED_DELIVERY_PROFILES, getProfileById } from '../../../config/delivery-standards';
import { createSyntheticWav } from './wav-generator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runUpgradeDeliveryQCTests() {
  console.log('🧪 Running Sonichecks Professional Delivery QC Upgrade Test Suite...\n');

  // 1. Spotify Target Profile Test (-14 LUFS, -1.0 dBTP ceiling)
  {
    const spotifyProfile = getProfileById('spotify');
    assert(spotifyProfile.platform === 'Spotify', 'Platform must be Spotify');
    assert(spotifyProfile.version === '2.1', 'Profile version should be 2.1');
    assert(spotifyProfile.rules.max_true_peak_dbtp === -1.0, 'Spotify True Peak ceiling should be -1.0 dBTP');

    // Generate audio with hot peaks
    const hotWav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 2.0,
      generator: (t) => 0.99 * Math.sin(2 * Math.PI * 11025 * t + Math.PI / 4)
    });

    const analysis = await analyzeWavBuffer(hotWav, 'Over_Compressed_Master.wav');
    const qcResult = convertLocalMeasurementsToFileQCResult(analysis, spotifyProfile);

    assert(qcResult.overall_status === 'FAIL' || qcResult.overall_status === 'WARNING', 'Hot audio should trigger non-pass status');
    assert(qcResult.checks.length >= 6, 'Should evaluate all delivery check categories');
    
    // Validate What / Why / How explainability on failed checks
    const failedChecks = qcResult.checks.filter(c => c.status === 'FAIL' || c.status === 'WARNING');
    assert(failedChecks.length > 0, 'Should have at least one failing or warning check');
    for (const check of failedChecks) {
      assert(!!check.what, `Check ${check.name} must have a 'What happened' explanation`);
      assert(!!check.why, `Check ${check.name} must have a 'Why it matters' explanation`);
      assert(!!check.how, `Check ${check.name} must have a 'How to fix' action item`);
    }

    // Validate Waveform Envelope
    assert(Array.isArray(qcResult.waveform_peaks), 'Must return downsampled waveform envelope peaks');
    assert((qcResult.waveform_peaks?.length ?? 0) > 0, 'Waveform peaks must not be empty');

    // Validate Cryptographic Hash
    assert(qcResult.file_info?.sha256_hash?.length === 64, 'SHA-256 hash must be a 64-character hex string');
    console.log('  ✅ Test 1: Spotify Profile rules, What/Why/How explanations & SHA-256 verified');
  }

  // 2. ACX Audiobook Delivery Profile Test (-23 to -18 LUFS, -3.0 dBTP ceiling, silence rules)
  {
    const acxProfile = getProfileById('acx_audiobook');
    assert(acxProfile.platform === 'Audible / ACX', 'Platform must be Audible / ACX');
    assert(acxProfile.rules.max_true_peak_dbtp === -3.0, 'ACX ceiling must be -3.0 dBTP');
    assert(acxProfile.rules.min_leading_silence_sec === 0.5, 'ACX minimum leading silence should be 0.5s');

    // Generate compliant audiobook chapter (1.0s leading silence, -20 LUFS audio, 2.0s trailing silence)
    const acxWav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 6.0,
      generator: (t) => {
        if (t < 0.8 || t > 4.5) return 0.0;
        return 0.12 * Math.sin(2 * Math.PI * 300 * t);
      }
    });

    const analysis = await analyzeWavBuffer(acxWav, 'Chapter_01_Master.wav');
    const qcResult = convertLocalMeasurementsToFileQCResult(analysis, acxProfile);

    assert(qcResult.overall_status === 'PASS', 'Compliant audiobook master should PASS ACX QC');
    console.log('  ✅ Test 2: ACX Audiobook Profile compliance & silence gating verified');
  }

  // 3. Apple Digital Masters Profile Test (24-bit / 96kHz, -1.0 dBTP ceiling, zero clipping)
  {
    const admProfile = getProfileById('apple_music');
    assert((admProfile.rules.allowed_bit_depths?.includes(24)) === true, 'ADM must require 24-bit');
    
    // 16-bit audio delivered to ADM should trigger bit depth failure
    const wav16 = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 1.0,
      generator: (t) => 0.5 * Math.sin(2 * Math.PI * 440 * t)
    });

    const analysis = await analyzeWavBuffer(wav16, 'Song_16bit.wav');
    const qcResult = convertLocalMeasurementsToFileQCResult(analysis, admProfile);

    const bitDepthCheck = qcResult.checks.find(c => c.name.toLowerCase().includes('bit depth'));
    assert(bitDepthCheck?.status === 'FAIL', '16-bit audio must FAIL Apple Digital Masters profile');
    assert(!!bitDepthCheck?.how && bitDepthCheck.how.includes('24-bit'), 'Fix suggestion must recommend 24-bit export');
    console.log('  ✅ Test 3: Apple Music / ADM bit depth rule enforcement verified');
  }

  // 4. Clipping Event Timestamp Tracking
  {
    const clippedWav = createSyntheticWav({
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      durationSeconds: 2.0,
      generator: (t) => {
        if (t >= 0.5 && t <= 0.6) return 1.5; // Clipped pulse at 0.5s
        return 0.2 * Math.sin(2 * Math.PI * 440 * t);
      }
    });

    const analysis = await analyzeWavBuffer(clippedWav, 'Clipped_Synth.wav');
    assert(analysis.clipping.clippingDetected, 'Must detect digital clipping');
    assert((analysis.clipping.clippingTimestampsSec?.length ?? 0) > 0, 'Must record exact timestamps for clipping');
    assert(
      (analysis.clipping.clippingTimestampsSec?.[0] ?? 0) >= 0.45 && 
      (analysis.clipping.clippingTimestampsSec?.[0] ?? 0) <= 0.65, 
      'Clipping timestamp must be around 0.5s'
    );
    console.log('  ✅ Test 4: Precise clipping timestamp localization verified');
  }

  console.log('\n🎉 ALL PROFESSIONAL AUDIO DELIVERY QC UPGRADE TESTS PASSED!\n');
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('delivery-qc-upgrade.test')) {
  runUpgradeDeliveryQCTests().catch((err) => {
    console.error('❌ Test failure:', err);
    process.exit(1);
  });
}
