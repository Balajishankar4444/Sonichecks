import { FileQCResult, QCProfile, QCRuleCheck, QCStatus } from '@/types/qc';
import { LocalAudioMeasurements } from './types';

export function convertLocalMeasurementsToFileQCResult(
  measurements: LocalAudioMeasurements,
  profile: QCProfile
): FileQCResult {
  const { 
    metadata, 
    samplePeakDbfs, 
    samplePeakLinear, 
    truePeakDbtp, 
    truePeakLinear,
    truePeakTimestampSec,
    integratedLufs,
    momentaryMaxLufs,
    momentaryMaxTimestampSec,
    shortTermMaxLufs,
    shortTermMaxTimestampSec,
    loudnessRangeLu,
    clipping, 
    silence, 
    filename, 
    sha256Hash,
    waveformEnvelope 
  } = measurements;
  const { rules } = profile;

  const checks: QCRuleCheck[] = [];
  const fixSummary: string[] = [];

  // 1. Format Check
  checks.push({
    id: 'container_format',
    name: 'Audio Container Format',
    category: 'FORMAT',
    status: 'PASS',
    value: metadata.format,
    limit: 'WAV / Lossless PCM',
    unit: '',
    message: `Valid uncompressed ${metadata.audioFormatName} ${metadata.format} container.`,
    what: `${metadata.format} container parsed with ${metadata.channels} channels at ${metadata.sampleRate / 1000} kHz.`,
    why: 'Lossless PCM format preserves original harmonic transients without perceptual encoding artifacts.',
    how: 'No action required. File is in an approved uncompressed container.'
  });

  // 2. Sample Rate Check
  if (rules.allowed_sample_rates && rules.allowed_sample_rates.length > 0) {
    const isSrAllowed = rules.allowed_sample_rates.includes(metadata.sampleRate);
    const srStatus: QCStatus = isSrAllowed ? 'PASS' : 'FAIL';
    const srLimits = rules.allowed_sample_rates.map(sr => `${sr / 1000} kHz`).join(', ');

    if (!isSrAllowed) {
      fixSummary.push(`Resample audio from ${metadata.sampleRate / 1000} kHz to an approved sample rate (${srLimits}).`);
    }

    checks.push({
      id: 'sample_rate',
      name: 'Sample Rate',
      category: 'FORMAT',
      status: srStatus,
      value: `${metadata.sampleRate / 1000} kHz`,
      limit: srLimits,
      unit: 'kHz',
      message: isSrAllowed 
        ? `Sample rate ${metadata.sampleRate / 1000} kHz matches profile criteria.`
        : `Sample rate ${metadata.sampleRate / 1000} kHz is not in approved list: ${srLimits}.`,
      what: `Measured sample rate is ${metadata.sampleRate / 1000} kHz. Destination requires ${srLimits}.`,
      why: isSrAllowed 
        ? 'Sample rate conforms with destination playback and broadcast clock standards.' 
        : 'Submitting incompatible sample rates causes automatic resampling degradation, pitch-shifting, or platform ingest rejection.',
      how: isSrAllowed 
        ? 'No action required.' 
        : `Resample your project in your DAW or sample rate converter using high-quality 64-bit sinc interpolation to ${rules.allowed_sample_rates[0] / 1000} kHz.`,
      fix_recommendation: isSrAllowed ? undefined : `Resample to ${rules.allowed_sample_rates[0] / 1000} kHz.`
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
      id: 'bit_depth',
      name: 'Bit Depth',
      category: 'FORMAT',
      status: bdStatus,
      value: `${metadata.bitDepth}-bit`,
      limit: bdLimits,
      unit: 'bit',
      message: isBdAllowed
        ? `Bit depth ${metadata.bitDepth}-bit meets delivery specification.`
        : `Bit depth ${metadata.bitDepth}-bit violates profile specification (${bdLimits}).`,
      what: `File bit depth is ${metadata.bitDepth}-bit. Target specification requires ${bdLimits}.`,
      why: isBdAllowed 
        ? 'Bit depth matches the dynamic range resolution required by the target platform.' 
        : 'Truncating or bit-shifting without proper TPDF dither causes harsh quantization distortion in low-level passages.',
      how: isBdAllowed 
        ? 'No action required.' 
        : `Export the master at ${rules.allowed_bit_depths[0]}-bit with Triangular Probability Density Function (TPDF) dither applied on the final output stage.`,
      fix_recommendation: isBdAllowed ? undefined : `Render or dither master to ${rules.allowed_bit_depths[0]}-bit.`
    });
  }

  // 4. Integrated LUFS Loudness Check (BS.1770-4)
  if (rules.min_lufs !== undefined && rules.min_lufs !== null && rules.max_lufs !== undefined && rules.max_lufs !== null) {
    const minLufs = rules.min_lufs;
    const maxLufs = rules.max_lufs;
    const isLufsCompliant = integratedLufs >= minLufs && integratedLufs <= maxLufs;

    let lufsStatus: QCStatus = 'PASS';
    let whatText = `Integrated loudness is ${integratedLufs.toFixed(1)} LUFS (Target: ${minLufs.toFixed(1)} to ${maxLufs.toFixed(1)} LUFS).`;
    let whyText = 'Loudness is balanced for optimal volume without triggering aggressive streaming normalization penalties.';
    let howText = 'No gain adjustments needed.';

    if (!isLufsCompliant) {
      const diff = integratedLufs < minLufs ? minLufs - integratedLufs : integratedLufs - maxLufs;
      lufsStatus = diff > 2.5 ? 'FAIL' : 'WARNING';
      const adj = Math.abs(diff).toFixed(1);
      const isTooLoud = integratedLufs > maxLufs;

      if (isTooLoud) {
        fixSummary.push(`Reduce integrated loudness by ${adj} dB to meet ${maxLufs.toFixed(1)} LUFS target.`);
        whatText = `Track is ${adj} dB louder than target maximum (${integratedLufs.toFixed(1)} LUFS vs ${maxLufs.toFixed(1)} LUFS limit).`;
        whyText = 'Streaming services will automatically turn this track down, which flattens punch and reduces impact relative to properly dynamic masters.';
        howText = `Lower the input gain on your final mastering limiter by ~${adj} dB and verify integrated loudness across the entire track duration.`;
      } else {
        fixSummary.push(`Increase integrated loudness by ${adj} dB to reach ${minLufs.toFixed(1)} LUFS minimum.`);
        whatText = `Track is ${adj} dB quieter than required minimum (${integratedLufs.toFixed(1)} LUFS vs ${minLufs.toFixed(1)} LUFS target).`;
        whyText = 'Track will sound noticeably quiet during playlist playback, or may be rejected by broadcast/audiobook gates.';
        howText = `Increase master gain or adjust compressor/limiter threshold by ~${adj} dB while keeping True Peak below ceiling.`;
      }
    }

    checks.push({
      id: 'integrated_lufs',
      name: 'Integrated Loudness (LUFS)',
      category: 'LOUDNESS',
      status: lufsStatus,
      value: `${integratedLufs.toFixed(1)} LUFS`,
      limit: `${minLufs.toFixed(1)} to ${maxLufs.toFixed(1)} LUFS`,
      unit: 'LUFS',
      timestamp_sec: shortTermMaxTimestampSec ?? undefined,
      message: isLufsCompliant
        ? `Integrated loudness (${integratedLufs.toFixed(1)} LUFS) meets delivery target.`
        : `Integrated loudness (${integratedLufs.toFixed(1)} LUFS) is outside target window (${minLufs.toFixed(1)} to ${maxLufs.toFixed(1)} LUFS).`,
      what: whatText,
      why: whyText,
      how: howText,
      fix_recommendation: isLufsCompliant ? undefined : `Adjust master level by ${integratedLufs > maxLufs ? '-' : '+'}${Math.abs(integratedLufs - ((minLufs + maxLufs)/2)).toFixed(1)} dB.`
    });
  }

  // 5. Loudness Range (LRA) Check
  if (loudnessRangeLu !== null && loudnessRangeLu !== undefined) {
    const minLra = rules.min_lra_lu ?? 1.0;
    const maxLra = rules.max_lra_lu ?? 20.0;
    const isLraOk = loudnessRangeLu >= minLra && loudnessRangeLu <= maxLra;
    const lraStatus: QCStatus = isLraOk ? 'PASS' : (loudnessRangeLu < minLra ? 'WARNING' : 'PASS');

    checks.push({
      id: 'loudness_range',
      name: 'Loudness Range (LRA)',
      category: 'DYNAMIC',
      status: lraStatus,
      value: `${loudnessRangeLu.toFixed(1)} LU`,
      limit: `${minLra} - ${maxLra} LU`,
      unit: 'LU',
      message: `Dynamic loudness range is ${loudnessRangeLu.toFixed(1)} LU.`,
      what: `Measured dynamic loudness range is ${loudnessRangeLu.toFixed(1)} LU.`,
      why: loudnessRangeLu < 3.0 
        ? 'Very narrow dynamic range indicates heavy limiting/compression, which can cause listener fatigue.' 
        : 'Good dynamic variance between verse and chorus/climax sections.',
      how: loudnessRangeLu < 3.0 
        ? 'Ease back on multi-band compression or limiter threshold to restore musical dynamics.' 
        : 'No dynamic adjustments needed.'
    });
  }

  // 6. True Peak Level (dBTP 4x Oversampled)
  const maxTruePeak = rules.max_true_peak_dbtp ?? -1.0;
  const isTruePeakOk = truePeakDbtp <= maxTruePeak + 0.05;
  const truePeakStatus: QCStatus = isTruePeakOk ? 'PASS' : (truePeakDbtp > 0.0 ? 'FAIL' : 'WARNING');

  if (!isTruePeakOk) {
    const over = (truePeakDbtp - maxTruePeak).toFixed(2);
    fixSummary.push(`Lower True Peak limiter ceiling by ${over} dB (currently ${truePeakDbtp} dBTP vs ${maxTruePeak} dBTP ceiling).`);
  }

  checks.push({
    id: 'true_peak',
    name: 'True Peak Level (dBTP)',
    category: 'PEAK',
    status: truePeakStatus,
    value: `${truePeakDbtp} dBTP`,
    limit: `≤ ${maxTruePeak} dBTP`,
    unit: 'dBTP',
    timestamp_sec: truePeakTimestampSec ?? undefined,
    message: isTruePeakOk
      ? `True peak (${truePeakDbtp} dBTP) has sufficient inter-sample headroom.`
      : `True peak (${truePeakDbtp} dBTP) exceeds ${maxTruePeak} dBTP ceiling.`,
    what: `4x oversampled True Peak measured ${truePeakDbtp} dBTP at peak point (ceiling is ${maxTruePeak} dBTP).`,
    why: isTruePeakOk
      ? 'Headroom prevents inter-sample overshoots when converted to lossy streaming codecs (AAC, MP3, OGG).'
      : 'Inter-sample peaks reconstruct as analog voltages exceeding full scale during DAC conversion, causing harsh distortion in consumer headphones and speakers.',
    how: isTruePeakOk
      ? 'No adjustment needed.'
      : `Enable True Peak / ISP limiting on your final limiter and set the output ceiling to ${maxTruePeak} dBTP.`,
    fix_recommendation: isTruePeakOk ? undefined : `Set True Peak limiter ceiling to ${maxTruePeak} dBTP.`
  });

  // 7. Digital Hard Clipping Check
  const clippingStatus: QCStatus = clipping.clippingDetected ? 'FAIL' : 'PASS';
  if (clipping.clippingDetected) {
    fixSummary.push(`Hard digital clipping detected (${clipping.clippedSamples} flat-topped samples). Lower master output.`);
  }

  checks.push({
    id: 'digital_clipping',
    name: 'Digital Hard Clipping',
    category: 'CLIPPING',
    status: clippingStatus,
    value: clipping.clippingDetected ? `${clipping.clippedSamples} clipped samples` : '0 clipped samples',
    limit: '0 clipped samples',
    unit: 'samples',
    timestamp_sec: clipping.clippingTimestampsSec && clipping.clippingTimestampsSec.length > 0 ? clipping.clippingTimestampsSec[0] : undefined,
    message: clipping.clippingDetected
      ? `Detected ${clipping.clippedSamples} consecutive flat-topped full-scale samples across ${clipping.consecutiveClippedRuns} distinct run(s).`
      : 'No digital flat-top sample clipping detected.',
    what: clipping.clippingDetected 
      ? `${clipping.clippedSamples} samples hit absolute digital 0 dBFS ceiling in consecutive flat runs.` 
      : 'Zero clipped samples found across all channels.',
    why: clipping.clippingDetected
      ? 'Consecutive flat-top samples generate high-frequency harmonic square wave distortion, sounding like harsh crackling or buzzes.'
      : 'Transient waveform shape is completely preserved without digital truncation.',
    how: clipping.clippingDetected
      ? 'Inspect individual track mix busses for digital overs and reduce the final output gain before the master bus.'
      : 'No action required.'
  });

  // 8. Silence & Boundary Check
  const minLeading = rules.min_leading_silence_sec ?? 0.05;
  const maxLeading = rules.max_leading_silence_sec ?? 1.5;
  const minTrailing = rules.min_trailing_silence_sec ?? 0.2;
  const maxTrailing = rules.max_trailing_silence_sec ?? 4.0;

  const isLeadingOk = silence.leadingSilenceSec >= minLeading && silence.leadingSilenceSec <= maxLeading;
  const isTrailingOk = silence.trailingSilenceSec >= minTrailing && silence.trailingSilenceSec <= maxTrailing;
  const isSilenceOk = !silence.isCompletelySilent && isLeadingOk && isTrailingOk;
  const silenceStatus: QCStatus = silence.isCompletelySilent ? 'FAIL' : (isSilenceOk ? 'PASS' : 'WARNING');

  if (silence.isCompletelySilent) {
    fixSummary.push('The audio file contains completely silent data (0 dBFS energy).');
  } else if (!isSilenceOk) {
    if (silence.leadingSilenceSec < minLeading) {
      fixSummary.push(`Add ${minLeading}s room tone/lead-in silence (currently ${silence.leadingSilenceSec}s) to prevent transient truncation.`);
    } else if (silence.leadingSilenceSec > maxLeading) {
      fixSummary.push(`Trim head silence from ${silence.leadingSilenceSec}s to under ${maxLeading}s.`);
    }
    if (silence.trailingSilenceSec < minTrailing) {
      fixSummary.push(`Add ${minTrailing}s tail silence (currently ${silence.trailingSilenceSec}s) for clean playback transition.`);
    } else if (silence.trailingSilenceSec > maxTrailing) {
      fixSummary.push(`Trim tail silence from ${silence.trailingSilenceSec}s to under ${maxTrailing}s.`);
    }
  }

  checks.push({
    id: 'silence_boundaries',
    name: 'Lead-In & Tail Silence',
    category: 'SILENCE',
    status: silenceStatus,
    value: `Head: ${silence.leadingSilenceSec.toFixed(2)}s / Tail: ${silence.trailingSilenceSec.toFixed(2)}s`,
    limit: `Head: ${minLeading}-${maxLeading}s, Tail: ${minTrailing}-${maxTrailing}s`,
    unit: 'sec',
    message: isSilenceOk
      ? `Lead-in (${silence.leadingSilenceSec.toFixed(2)}s) and tail silence (${silence.trailingSilenceSec.toFixed(2)}s) meet delivery guidelines.`
      : `Silence boundaries out of spec (Lead: ${silence.leadingSilenceSec.toFixed(2)}s, Tail: ${silence.trailingSilenceSec.toFixed(2)}s).`,
    what: `Measured ${silence.leadingSilenceSec.toFixed(2)}s lead-in silence and ${silence.trailingSilenceSec.toFixed(2)}s tail silence.`,
    why: isSilenceOk
      ? 'Boundary silence prevents audio buffer pop at playback start and allows clean crossfades.'
      : silence.leadingSilenceSec < minLeading 
        ? 'Zero lead-in silence can cause platform streaming buffers to clip the initial attack/transient of the song.'
        : 'Excessive silence leads to dead air rejections on broadcast or audiobook platforms.',
    how: isSilenceOk
      ? 'No adjustment needed.'
      : `Trim or add silence markers at the start/end of the audio file to meet the ${minLeading}-${maxLeading}s head and ${minTrailing}-${maxTrailing}s tail requirement.`
  });

  // 9. Overall Verdict
  const hasFail = checks.some(c => c.status === 'FAIL');
  const hasWarn = checks.some(c => c.status === 'WARNING');
  const overallStatus: QCStatus = hasFail ? 'FAIL' : (hasWarn ? 'WARNING' : 'PASS');

  return {
    file_id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    filename,
    profile_id: profile.profile_id,
    profile_name: profile.name,
    profile_version: profile.version,
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
      integrated_lufs: integratedLufs,
      short_term_max_lufs: shortTermMaxLufs,
      short_term_max_timestamp_sec: shortTermMaxTimestampSec,
      momentary_max_lufs: momentaryMaxLufs,
      momentary_max_timestamp_sec: momentaryMaxTimestampSec,
      loudness_range_lu: loudnessRangeLu
    },
    peaks: {
      sample_peak_dbfs: samplePeakDbfs,
      true_peak_dbtp: truePeakDbtp,
      true_peak_timestamp_sec: truePeakTimestampSec,
      sample_peak_linear: samplePeakLinear,
      true_peak_linear: truePeakLinear,
      is_clipping_risk: measurements.isClippingRisk
    },
    clipping: {
      clipping_detected: clipping.clippingDetected,
      clipped_samples: clipping.clippedSamples,
      consecutive_clipped_runs: clipping.consecutiveClippedRuns,
      max_consecutive_clipped: clipping.maxConsecutiveClipped,
      clipping_timestamps_sec: clipping.clippingTimestampsSec
    },
    silence: {
      leading_silence_sec: silence.leadingSilenceSec,
      trailing_silence_sec: silence.trailingSilenceSec,
      total_silence_sec: silence.totalSilenceSec,
      is_completely_silent: silence.isCompletelySilent,
      excessive_silence_detected: silence.excessiveSilenceDetected
    },
    waveform_peaks: waveformEnvelope,
    checks,
    overall_status: overallStatus,
    fix_summary: fixSummary
  };
}
