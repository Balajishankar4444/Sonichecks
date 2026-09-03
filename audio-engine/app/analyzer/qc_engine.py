from typing import Dict, List, Optional
from ..models.results import (
    AudioFileInfo,
    LoudnessResult,
    PeakResult,
    ClippingResult,
    SilenceResult,
    QCRuleCheck,
    QCStatus,
    FileQCResult,
    QCProfile,
    QCProfileRules
)

# Built-in QC Profiles
BUILTIN_PROFILES: Dict[str, QCProfile] = {
    "standard": QCProfile(
        profile_id="standard",
        name="Standard Delivery",
        description="General-purpose delivery profile for modern digital releases and distribution.",
        category="General",
        rules=QCProfileRules(
            allowed_sample_rates=[44100, 48000, 88200, 96000],
            allowed_bit_depths=[16, 24, 32],
            allowed_channels=[1, 2],
            min_lufs=-18.0,
            max_lufs=-12.0,
            target_lufs_tolerance=2.0,
            max_true_peak_dbtp=-1.0,
            max_sample_peak_dbfs=-0.1,
            allow_clipping=False,
            max_leading_silence_sec=1.5,
            max_trailing_silence_sec=3.5,
            max_total_silence_percent=40.0
        )
    ),
    "streaming": QCProfile(
        profile_id="streaming",
        name="Streaming (Spotify / Apple Music)",
        description="Optimized for online streaming services to avoid dynamic normalization penalties and lossy codec distortion.",
        category="Streaming",
        rules=QCProfileRules(
            allowed_sample_rates=[44100, 48000],
            allowed_bit_depths=[16, 24],
            allowed_channels=[1, 2],
            min_lufs=-16.0,
            max_lufs=-13.0,
            target_lufs_tolerance=1.5,
            max_true_peak_dbtp=-1.0,
            max_sample_peak_dbfs=-0.1,
            allow_clipping=False,
            max_leading_silence_sec=1.0,
            max_trailing_silence_sec=3.0,
            max_total_silence_percent=30.0
        )
    ),
    "broadcast_ebu": QCProfile(
        profile_id="broadcast_ebu",
        name="Broadcast (EBU R128)",
        description="Standard European broadcast compliance requiring strict -23.0 LUFS target level and -1.0 dBTP ceiling.",
        category="Broadcast",
        rules=QCProfileRules(
            allowed_sample_rates=[48000],
            allowed_bit_depths=[24],
            allowed_channels=[1, 2, 6],
            min_lufs=-24.0,
            max_lufs=-22.0,
            target_lufs_tolerance=0.5,
            max_true_peak_dbtp=-1.0,
            max_sample_peak_dbfs=-0.2,
            allow_clipping=False,
            max_leading_silence_sec=0.5,
            max_trailing_silence_sec=2.0,
            max_total_silence_percent=25.0
        )
    ),
    "acx_audiobook": QCProfile(
        profile_id="acx_audiobook",
        name="Audiobook (ACX / Audible)",
        description="Strict spoken-word delivery specification: -23 to -18 LUFS RMS/Loudness, -3.0 dBTP ceiling, controlled room tone head/tail silence.",
        category="Audiobook",
        rules=QCProfileRules(
            allowed_sample_rates=[44100],
            allowed_bit_depths=[16, 24],
            allowed_channels=[1, 2],
            min_lufs=-23.0,
            max_lufs=-18.0,
            target_lufs_tolerance=1.0,
            max_true_peak_dbtp=-3.0,
            max_sample_peak_dbfs=-3.0,
            allow_clipping=False,
            min_leading_silence_sec=0.1,
            max_leading_silence_sec=0.5,
            min_trailing_silence_sec=1.0,
            max_trailing_silence_sec=5.0,
            max_total_silence_percent=50.0
        )
    ),
    "club_loud": QCProfile(
        profile_id="club_loud",
        name="Club / DJ Master",
        description="High-energy master profile for club tracks and DJ playback (-9 to -6 LUFS).",
        category="Club",
        rules=QCProfileRules(
            allowed_sample_rates=[44100, 48000, 96000],
            allowed_bit_depths=[16, 24, 32],
            allowed_channels=[2],
            min_lufs=-10.0,
            max_lufs=-6.0,
            target_lufs_tolerance=1.5,
            max_true_peak_dbtp=-0.1,
            max_sample_peak_dbfs=0.0,
            allow_clipping=False,
            max_leading_silence_sec=1.0,
            max_trailing_silence_sec=2.0,
            max_total_silence_percent=20.0
        )
    )
}

def get_profile(profile_id: Optional[str] = None) -> QCProfile:
    if profile_id and profile_id.lower() in BUILTIN_PROFILES:
        return BUILTIN_PROFILES[profile_id.lower()]
    return BUILTIN_PROFILES["standard"]

def evaluate_file_qc(
    file_id: str,
    file_info: AudioFileInfo,
    loudness: LoudnessResult,
    peaks: PeakResult,
    clipping: ClippingResult,
    silence: SilenceResult,
    profile: QCProfile
) -> FileQCResult:
    checks: List[QCRuleCheck] = []
    fix_summary: List[str] = []
    rules = profile.rules

    # 1. Sample Rate Check
    if rules.allowed_sample_rates:
        if file_info.sample_rate in rules.allowed_sample_rates:
            checks.append(QCRuleCheck(
                name="Sample Rate",
                status=QCStatus.PASS,
                value=f"{file_info.sample_rate / 1000} kHz",
                limit=f"Allowed: {', '.join([f'{sr/1000}k' for sr in rules.allowed_sample_rates])}",
                unit="Hz",
                message=f"Sample rate {file_info.sample_rate} Hz meets profile requirements."
            ))
        else:
            checks.append(QCRuleCheck(
                name="Sample Rate",
                status=QCStatus.FAIL,
                value=f"{file_info.sample_rate / 1000} kHz",
                limit=f"Allowed: {', '.join([f'{sr/1000}k' for sr in rules.allowed_sample_rates])}",
                unit="Hz",
                message=f"Sample rate is {file_info.sample_rate} Hz, but profile expects {rules.allowed_sample_rates}.",
                fix_recommendation=f"Resample your master to a supported delivery rate ({', '.join([f'{sr} Hz' for sr in rules.allowed_sample_rates])}) using a high-quality SRC algorithm."
            ))
            fix_summary.append(f"Resample audio from {file_info.sample_rate} Hz to a supported rate.")

    # 2. Bit Depth Check
    if rules.allowed_bit_depths and file_info.bit_depth:
        if file_info.bit_depth in rules.allowed_bit_depths:
            checks.append(QCRuleCheck(
                name="Bit Depth",
                status=QCStatus.PASS,
                value=f"{file_info.bit_depth}-bit",
                limit=f"Allowed: {rules.allowed_bit_depths}-bit",
                unit="bit",
                message=f"Bit depth {file_info.bit_depth}-bit is acceptable."
            ))
        else:
            checks.append(QCRuleCheck(
                name="Bit Depth",
                status=QCStatus.FAIL,
                value=f"{file_info.bit_depth}-bit",
                limit=f"Allowed: {rules.allowed_bit_depths}-bit",
                unit="bit",
                message=f"Bit depth is {file_info.bit_depth}-bit; delivery requirement is {rules.allowed_bit_depths}-bit.",
                fix_recommendation=f"Export the file at {min(rules.allowed_bit_depths)}-bit or {max(rules.allowed_bit_depths)}-bit with proper TPDF dither if reducing bit depth."
            ))
            fix_summary.append(f"Export file with {rules.allowed_bit_depths}-bit depth.")

    # 3. Channel Layout Check
    if rules.allowed_channels:
        if file_info.channels in rules.allowed_channels:
            checks.append(QCRuleCheck(
                name="Channels",
                status=QCStatus.PASS,
                value=file_info.channel_layout,
                limit=f"{rules.allowed_channels} ch",
                unit="channels",
                message=f"Channel layout '{file_info.channel_layout}' is allowed."
            ))
        else:
            checks.append(QCRuleCheck(
                name="Channels",
                status=QCStatus.FAIL,
                value=file_info.channel_layout,
                limit=f"{rules.allowed_channels} ch",
                unit="channels",
                message=f"Channel configuration has {file_info.channels} channels, which does not match profile.",
                fix_recommendation="Render audio in standard Stereo (2 ch) or Mono (1 ch) layout as required by your distributor."
            ))
            fix_summary.append("Correct audio channel count.")

    # 4. Loudness (Integrated LUFS) Check
    if rules.min_lufs is not None and rules.max_lufs is not None:
        lufs = loudness.integrated_lufs
        tol = rules.target_lufs_tolerance or 1.5
        if lufs is None or lufs <= -65.0:
            checks.append(QCRuleCheck(
                name="Integrated Loudness",
                status=QCStatus.FAIL,
                value=f"{lufs} LUFS" if lufs is not None else "Silent/N/A",
                limit=f"{rules.min_lufs} to {rules.max_lufs} LUFS",
                unit="LUFS",
                message="Audio is completely silent or extremely quiet.",
                fix_recommendation="Check the render export settings in your DAW; the track appears unrendered or muted."
            ))
            fix_summary.append("Audio is silent; re-export with audible program material.")
        elif rules.min_lufs <= lufs <= rules.max_lufs:
            checks.append(QCRuleCheck(
                name="Integrated Loudness",
                status=QCStatus.PASS,
                value=f"{lufs} LUFS",
                limit=f"{rules.min_lufs} to {rules.max_lufs} LUFS",
                unit="LUFS",
                message=f"Integrated loudness of {lufs} LUFS is within target range ({rules.min_lufs} to {rules.max_lufs} LUFS)."
            ))
        elif (rules.min_lufs - tol) <= lufs < rules.min_lufs or rules.max_lufs < lufs <= (rules.max_lufs + tol):
            direction = "too quiet" if lufs < rules.min_lufs else "too loud"
            checks.append(QCRuleCheck(
                name="Integrated Loudness",
                status=QCStatus.WARNING,
                value=f"{lufs} LUFS",
                limit=f"{rules.min_lufs} to {rules.max_lufs} LUFS",
                unit="LUFS",
                message=f"Integrated loudness is slightly {direction} ({lufs} LUFS vs target {rules.min_lufs} to {rules.max_lufs} LUFS).",
                fix_recommendation=f"Adjust your master limiter or master fader by approximately {round(abs((rules.min_lufs + rules.max_lufs)/2 - lufs), 1)} dB to hit target."
            ))
            fix_summary.append(f"Loudness is slightly {direction} ({lufs} LUFS); adjust limiter gain.")
        else:
            direction = "too quiet" if lufs < rules.min_lufs else "too loud"
            checks.append(QCRuleCheck(
                name="Integrated Loudness",
                status=QCStatus.FAIL,
                value=f"{lufs} LUFS",
                limit=f"{rules.min_lufs} to {rules.max_lufs} LUFS",
                unit="LUFS",
                message=f"Integrated loudness is significantly {direction} at {lufs} LUFS (profile requirement: {rules.min_lufs} to {rules.max_lufs} LUFS).",
                fix_recommendation=f"{'Increase gain/limiting' if lufs < rules.min_lufs else 'Lower master limiter threshold/gain'} by ~{round(abs((rules.min_lufs + rules.max_lufs)/2 - lufs), 1)} dB to avoid streaming normalization penalties."
            ))
            fix_summary.append(f"Loudness is {direction} ({lufs} LUFS); target is {rules.min_lufs} to {rules.max_lufs} LUFS.")

    # 5. True Peak Check
    if rules.max_true_peak_dbtp is not None:
        tp = peaks.true_peak_dbtp
        max_tp = rules.max_true_peak_dbtp
        if tp <= max_tp:
            checks.append(QCRuleCheck(
                name="True Peak",
                status=QCStatus.PASS,
                value=f"{tp} dBTP",
                limit=f"≤ {max_tp} dBTP",
                unit="dBTP",
                message=f"True peak of {tp} dBTP is safely below ceiling limit of {max_tp} dBTP."
            ))
        elif tp <= (max_tp + 0.3):
            checks.append(QCRuleCheck(
                name="True Peak",
                status=QCStatus.WARNING,
                value=f"{tp} dBTP",
                limit=f"≤ {max_tp} dBTP",
                unit="dBTP",
                message=f"True peak of {tp} dBTP slightly exceeds {max_tp} dBTP ceiling.",
                fix_recommendation=f"Lower master ceiling on your true-peak limiter to {max_tp} dBTP to prevent inter-sample clipping during lossy MP3/AAC transcoding."
            ))
            fix_summary.append(f"Lower master true-peak ceiling to {max_tp} dBTP.")
        else:
            checks.append(QCRuleCheck(
                name="True Peak",
                status=QCStatus.FAIL,
                value=f"{tp} dBTP",
                limit=f"≤ {max_tp} dBTP",
                unit="dBTP",
                message=f"True peak exceeds ceiling by {round(tp - max_tp, 2)} dB ({tp} dBTP vs {max_tp} dBTP max).",
                fix_recommendation=f"Enable True Peak (ISP) mode on your master limiter and set the output ceiling to {max_tp} dBTP."
            ))
            fix_summary.append(f"Reduce True Peak level ({tp} dBTP exceeds {max_tp} dBTP limit).")

    # 6. Clipping Check
    if not rules.allow_clipping:
        if not clipping.clipping_detected:
            checks.append(QCRuleCheck(
                name="Digital Clipping",
                status=QCStatus.PASS,
                value="None",
                limit="0 clipped samples",
                unit="samples",
                message="No hard digital clipping detected."
            ))
        else:
            checks.append(QCRuleCheck(
                name="Digital Clipping",
                status=QCStatus.FAIL,
                value=f"{clipping.clipped_samples:,} samples ({clipping.consecutive_clipped_runs} events)",
                limit="0 clipped samples",
                unit="samples",
                message=f"Hard digital clipping detected with {clipping.clipped_samples:,} samples hitting flat ceiling.",
                fix_recommendation="Check the mix bus and master chain for unconstrained digital clipping. Pull back track/bus faders before the master limiter."
            ))
            fix_summary.append(f"Eliminate digital clipping ({clipping.clipped_samples:,} clipped samples detected).")

    # 7. Silence Analysis Checks
    if silence.is_completely_silent:
        checks.append(QCRuleCheck(
            name="Audio Content",
            status=QCStatus.FAIL,
            value="Completely Silent",
            limit="Audible signal",
            unit="sec",
            message="The entire audio file contains no audible sound (silent signal).",
            fix_recommendation="Ensure the correct track/stems were unmuted when bouncing audio."
        ))
        fix_summary.append("File is completely silent; re-render with active audio.")
    else:
        # Leading silence
        if rules.max_leading_silence_sec is not None:
            if silence.leading_silence_sec <= rules.max_leading_silence_sec:
                if rules.min_leading_silence_sec and silence.leading_silence_sec < rules.min_leading_silence_sec:
                    checks.append(QCRuleCheck(
                        name="Leading Silence",
                        status=QCStatus.WARNING,
                        value=f"{silence.leading_silence_sec}s",
                        limit=f"Min {rules.min_leading_silence_sec}s",
                        unit="sec",
                        message=f"Leading silence is very short ({silence.leading_silence_sec}s; minimum recommended is {rules.min_leading_silence_sec}s).",
                        fix_recommendation=f"Add {rules.min_leading_silence_sec}s of room tone before audio start to prevent first-transient truncation."
                    ))
                else:
                    checks.append(QCRuleCheck(
                        name="Leading Silence",
                        status=QCStatus.PASS,
                        value=f"{silence.leading_silence_sec}s",
                        limit=f"≤ {rules.max_leading_silence_sec}s",
                        unit="sec",
                        message=f"Leading silence of {silence.leading_silence_sec}s is clean and concise."
                    ))
            else:
                checks.append(QCRuleCheck(
                    name="Leading Silence",
                    status=QCStatus.WARNING,
                    value=f"{silence.leading_silence_sec}s",
                    limit=f"≤ {rules.max_leading_silence_sec}s",
                    unit="sec",
                    message=f"Leading silence is {silence.leading_silence_sec}s (exceeds {rules.max_leading_silence_sec}s limit).",
                    fix_recommendation=f"Trim the dead air at the beginning of the file to less than {rules.max_leading_silence_sec}s."
                ))
                fix_summary.append(f"Trim {silence.leading_silence_sec}s leading silence at beginning.")

        # Trailing silence
        if rules.max_trailing_silence_sec is not None:
            if silence.trailing_silence_sec <= rules.max_trailing_silence_sec:
                if rules.min_trailing_silence_sec and silence.trailing_silence_sec < rules.min_trailing_silence_sec:
                    checks.append(QCRuleCheck(
                        name="Trailing Silence",
                        status=QCStatus.WARNING,
                        value=f"{silence.trailing_silence_sec}s",
                        limit=f"Min {rules.min_trailing_silence_sec}s",
                        unit="sec",
                        message=f"Trailing silence is {silence.trailing_silence_sec}s (profile requires at least {rules.min_trailing_silence_sec}s).",
                        fix_recommendation=f"Allow at least {rules.min_trailing_silence_sec}s of room tone at the end of the chapter/track."
                    ))
                else:
                    checks.append(QCRuleCheck(
                        name="Trailing Silence",
                        status=QCStatus.PASS,
                        value=f"{silence.trailing_silence_sec}s",
                        limit=f"≤ {rules.max_trailing_silence_sec}s",
                        unit="sec",
                        message=f"Trailing silence of {silence.trailing_silence_sec}s is within limit."
                    ))
            else:
                checks.append(QCRuleCheck(
                    name="Trailing Silence",
                    status=QCStatus.WARNING,
                    value=f"{silence.trailing_silence_sec}s",
                    limit=f"≤ {rules.max_trailing_silence_sec}s",
                    unit="sec",
                    message=f"Trailing silence is {silence.trailing_silence_sec}s (exceeds {rules.max_trailing_silence_sec}s max).",
                    fix_recommendation=f"Trim excess tail silence after the final fade-out to {rules.max_trailing_silence_sec}s or less."
                ))
                fix_summary.append(f"Trim {silence.trailing_silence_sec}s trailing silence at end.")

    # Determine Overall File Status
    has_fail = any(c.status == QCStatus.FAIL for c in checks)
    has_warn = any(c.status == QCStatus.WARNING for c in checks)

    if has_fail:
        overall_status = QCStatus.FAIL
    elif has_warn:
        overall_status = QCStatus.WARNING
    else:
        overall_status = QCStatus.PASS

    return FileQCResult(
        file_id=file_id,
        filename=file_info.filename,
        file_info=file_info,
        loudness=loudness,
        peaks=peaks,
        clipping=clipping,
        silence=silence,
        checks=checks,
        overall_status=overall_status,
        fix_summary=fix_summary
    )
