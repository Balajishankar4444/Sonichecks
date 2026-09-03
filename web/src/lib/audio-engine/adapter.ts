import { FileQCResult, QCProfile, QCRuleCheck, QCStatus } from '@/types/qc';
import { LocalAudioMeasurements } from './types';

export function convertLocalMeasurementsToFileQCResult(
  measurements: LocalAudioMeasurements,
  profile: QCProfile
): FileQCResult {
  const { metadata, samplePeakDbfs, samplePeakLinear, rmsDbfs, dcOffsetPercent, clipping, silence, filename, sha256Hash } = measurements;
  const { rules } = profile;

  const checks: QCRuleCheck[] = [];
  const fixSummary: string[] = [];

  // 1. Format Check
  checks.push({
    name: 'Audio Container Format',
    status: 'PASS',
    value: metadata.format,
    limit: 'WAV/PCM',
    unit: '',
    message: `Valid uncompressed ${metadata.audioFormatName} WAV container.`
  });

  // 2. Sample Rate Check
  if (rules.allowed_sample_rates && rules.allowed_sample_rates.length > 0) {
    const isSrAllowed = rules.allowed_sample_rates.includes(metadata.sampleRate);
    const srStatus: QCStatus = isSrAllowed ? 'PASS' : 'FAIL';
    const srLimits = rules.allowed_sample_rates.map(sr => `${sr / 1000}kHz`).join(', ');

    if (!isSrAllowed) {
      fixSummary.push(`Resample audio from ${metadata.sampleRate / 1000}kHz to an approved sample rate (${srLimits}).`);
    }

    checks.push({
      name: 'Sample Rate',
      status: srStatus,
      value: `${metadata.sampleRate / 1000} kHz`,
      limit: srLimits,
      unit: 'kHz',
      message: isSrAllowed 
        ? `Sample rate ${metadata.sampleRate / 1000} kHz matches profile criteria.`
        : `Sample rate ${metadata.sampleRate / 1000} kHz is not in approved list: ${srLimits}.`,
      fix_recommendation: isSrAllowed ? undefined : `Resample to ${rules.allowed_sample_rates[0] / 1000} kHz using high-quality sinc interpolation.`
    });
  }

  // 3. Bit Depth Check
  if (rules.allowed_bit_depths && rules.allowed_bit_depths.length > 0) {
    const isBdAllowed = rules.allowed_bit_depths.includes(metadata.bitDepth);
    const bdStatus: QCStatus = isBdAllowed ? 'PASS' : 'FAIL';
    const bdLimits = rules.allowed_bit_depths.map(b => `${b}-bit`).join(', ');

    if (!isBdAllowed) {
      fixSummary.push(`Export audio at ${bdLimits} instead of ${metadata.bitDepth}-bit.`);
    }

    checks.push({
      name: 'Bit Depth',
      status: bdStatus,
      value: `${metadata.bitDepth}-bit`,
      limit: bdLimits,
      unit: 'bit',
      message: isBdAllowed
        ? `Bit depth ${metadata.bitDepth}-bit meets delivery specification.`
        : `Bit depth ${metadata.bitDepth}-bit violates profile specification (${bdLimits}).`,
      fix_recommendation: isBdAllowed ? undefined : `Render or dither master to ${rules.allowed_bit_depths[0]}-bit.`
    });
  }

  // 4. Sample Peak Check
  const maxSamplePeak = rules.max_sample_peak_dbfs ?? -0.1;
  const isSamplePeakOk = samplePeakDbfs <= maxSamplePeak + 0.05;
  const peakStatus: QCStatus = isSamplePeakOk ? 'PASS' : (samplePeakDbfs > 0.0 ? 'FAIL' : 'WARNING');

  if (!isSamplePeakOk) {
    fixSummary.push(`Lower master output gain to bring sample peak below ${maxSamplePeak} dBFS (currently ${samplePeakDbfs} dBFS).`);
  }

  checks.push({
    name: 'Sample Peak Level',
    status: peakStatus,
    value: `${samplePeakDbfs} dBFS`,
    limit: `≤ ${maxSamplePeak} dBFS`,
    unit: 'dBFS',
    message: isSamplePeakOk
      ? `Sample peak of ${samplePeakDbfs} dBFS has safe digital headroom.`
      : `Sample peak of ${samplePeakDbfs} dBFS exceeds ${maxSamplePeak} dBFS ceiling.`,
    fix_recommendation: isSamplePeakOk ? undefined : `Apply a limiter ceiling of ${maxSamplePeak} dBFS.`
  });

  // 5. Digital Hard Clipping Check
  const clippingStatus: QCStatus = clipping.clippingDetected ? 'FAIL' : 'PASS';
  if (clipping.clippingDetected) {
    fixSummary.push(`Digital hard clipping detected (${clipping.clippedSamples} flat-topped samples). Lower master gain or adjust limiter.`);
  }

  checks.push({
    name: 'Digital Clipping',
    status: clippingStatus,
    value: clipping.clippingDetected ? `${clipping.clippedSamples} clipped smp` : 'None',
    limit: '0 clipped samples',
    unit: 'samples',
    message: clipping.clippingDetected
      ? `Detected ${clipping.clippedSamples} hard clipped samples across ${clipping.consecutiveClippedRuns} consecutive runs.`
      : 'No digital flat-top clipping detected.',
    fix_recommendation: clipping.clippingDetected ? 'Reduce gain by at least 1.0 dB before the final limiter stage.' : undefined
  });

  // 6. Silence & Truncation Check
  const maxLeading = rules.max_leading_silence_sec ?? 1.0;
  const maxTrailing = rules.max_trailing_silence_sec ?? 3.0;
  const isSilenceOk = !silence.isCompletelySilent && silence.leadingSilenceSec <= maxLeading && silence.trailingSilenceSec <= maxTrailing;
  const silenceStatus: QCStatus = silence.isCompletelySilent ? 'FAIL' : (isSilenceOk ? 'PASS' : 'WARNING');

  if (silence.isCompletelySilent) {
    fixSummary.push('The audio file contains completely silent data (0 dBFS energy).');
  } else if (!isSilenceOk) {
    if (silence.leadingSilenceSec > maxLeading) {
      fixSummary.push(`Trim head silence from ${silence.leadingSilenceSec}s to under ${maxLeading}s.`);
    }
    if (silence.trailingSilenceSec > maxTrailing) {
      fixSummary.push(`Trim tail silence from ${silence.trailingSilenceSec}s to under ${maxTrailing}s.`);
    }
  }

  checks.push({
    name: 'Head & Tail Silence',
    status: silenceStatus,
    value: `${silence.leadingSilenceSec}s / ${silence.trailingSilenceSec}s`,
    limit: `Head ≤ ${maxLeading}s, Tail ≤ ${maxTrailing}s`,
    unit: 'sec',
    message: isSilenceOk
      ? `Leading silence (${silence.leadingSilenceSec}s) and trailing silence (${silence.trailingSilenceSec}s) are within standard thresholds.`
      : `Silence boundaries exceed limits (Head: ${silence.leadingSilenceSec}s, Tail: ${silence.trailingSilenceSec}s).`,
    fix_recommendation: isSilenceOk ? undefined : 'Trim dead air at start and end of track.'
  });

  // 7. Overall Verdict
  const hasFail = checks.some(c => c.status === 'FAIL');
  const hasWarn = checks.some(c => c.status === 'WARNING');
  const overallStatus: QCStatus = hasFail ? 'FAIL' : (hasWarn ? 'WARNING' : 'PASS');

  return {
    file_id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    filename,
    file_info: {
      filename,
      file_size_bytes: metadata.fileSizeBytes,
      format: metadata.format,
      codec: `Browser DSP Engine (${metadata.audioFormatName})`,
      sample_rate: metadata.sampleRate,
      bit_depth: metadata.bitDepth,
      channels: metadata.channels,
      channel_layout: metadata.channelLayout,
      duration_seconds: metadata.durationSeconds,
      num_samples: metadata.numSamples,
      sha256_hash: sha256Hash
    },
    loudness: {
      integrated_lufs: null, // Deferred to Phase 2
      short_term_max_lufs: null,
      momentary_max_lufs: null,
      loudness_range_lu: null
    },
    peaks: {
      sample_peak_dbfs: samplePeakDbfs,
      true_peak_dbtp: samplePeakDbfs, // In Phase 1 browser engine, true peak is approximated by sample peak until polyphase resampler is ported
      sample_peak_linear: samplePeakLinear,
      true_peak_linear: samplePeakLinear,
      is_clipping_risk: samplePeakDbfs >= -0.05
    },
    clipping: {
      clipping_detected: clipping.clippingDetected,
      clipped_samples: clipping.clippedSamples,
      consecutive_clipped_runs: clipping.consecutiveClippedRuns,
      max_consecutive_clipped: clipping.maxConsecutiveClipped
    },
    silence: {
      leading_silence_sec: silence.leadingSilenceSec,
      trailing_silence_sec: silence.trailingSilenceSec,
      total_silence_sec: silence.totalSilenceSec,
      is_completely_silent: silence.isCompletelySilent,
      excessive_silence_detected: silence.excessiveSilenceDetected
    },
    checks,
    overall_status: overallStatus,
    fix_summary: fixSummary
  };
}
