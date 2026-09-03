import statistics
from typing import List, Dict, Any, Optional
from ..models.results import FileQCResult, ConsistencyIssue, QCStatus

def check_batch_consistency(results: List[FileQCResult]) -> List[ConsistencyIssue]:
    # Filter only successfully analyzed files for consistency check
    valid_results = [r for r in results if r.file_info is not None and r.overall_status != QCStatus.ERROR]
    
    if len(valid_results) <= 1:
        return []

    issues: List[ConsistencyIssue] = []

    # 1. Format Consistency
    formats: Dict[str, List[str]] = {}
    for r in valid_results:
        fmt = (r.file_info.format or "UNKNOWN").upper()
        formats.setdefault(fmt, []).append(r.filename)

    if len(formats) > 1:
        details_str = ", ".join([f"{fmt} ({len(files)} files)" for fmt, files in formats.items()])
        issues.append(ConsistencyIssue(
            metric="File Format",
            message=f"Mixed file formats detected across batch ({details_str}). For standard delivery packages, format consistency is recommended.",
            severity=QCStatus.WARNING,
            issue_type="INCONSISTENCY",
            affected_files=[fn for files in formats.values() for fn in files],
            details=formats
        ))

    # 2. Sample Rate Consistency
    sample_rates: Dict[int, List[str]] = {}
    for r in valid_results:
        sr = r.file_info.sample_rate
        sample_rates.setdefault(sr, []).append(r.filename)

    if len(sample_rates) > 1:
        details_str = ", ".join([f"{sr/1000} kHz ({len(files)} files)" for sr, files in sample_rates.items()])
        # Identify minority sample rate files as affected
        majority_sr = max(sample_rates.keys(), key=lambda k: len(sample_rates[k]))
        minority_files = [fn for sr, files in sample_rates.items() if sr != majority_sr for fn in files]

        issues.append(ConsistencyIssue(
            metric="Sample Rate",
            message=f"Sample rate mismatch across files ({details_str}). For consistent delivery, all tracks in a release should share the same sample rate (e.g. 48 kHz or 44.1 kHz).",
            severity=QCStatus.WARNING,
            issue_type="INCONSISTENCY",
            affected_files=minority_files if minority_files else [fn for files in sample_rates.values() for fn in files],
            details={str(k): v for k, v in sample_rates.items()}
        ))

    # 3. Bit Depth Consistency
    bit_depths: Dict[Any, List[str]] = {}
    for r in valid_results:
        bd = r.file_info.bit_depth
        bd_key = f"{bd}-bit" if bd else "Compressed/Unknown"
        bit_depths.setdefault(bd_key, []).append(r.filename)

    if len(bit_depths) > 1:
        details_str = ", ".join([f"{bd} ({len(files)} files)" for bd, files in bit_depths.items()])
        majority_bd = max(bit_depths.keys(), key=lambda k: len(bit_depths[k]))
        minority_files = [fn for bd, files in bit_depths.items() if bd != majority_bd for fn in files]

        issues.append(ConsistencyIssue(
            metric="Bit Depth",
            message=f"Bit depth variation detected ({details_str}). Consider standardizing to 24-bit or 16-bit across all deliverables.",
            severity=QCStatus.WARNING,
            issue_type="INCONSISTENCY",
            affected_files=minority_files if minority_files else [fn for files in bit_depths.values() for fn in files],
            details=bit_depths
        ))

    # 4. Channel Layout Consistency
    channel_layouts: Dict[str, List[str]] = {}
    for r in valid_results:
        cl = r.file_info.channel_layout
        channel_layouts.setdefault(cl, []).append(r.filename)

    if len(channel_layouts) > 1:
        details_str = ", ".join([f"{cl} ({len(files)} files)" for cl, files in channel_layouts.items()])
        issues.append(ConsistencyIssue(
            metric="Channel Configuration",
            message=f"Mixed channel configurations ({details_str}). Verify that mono and stereo tracks are intended.",
            severity=QCStatus.WARNING,
            issue_type="INCONSISTENCY",
            affected_files=[fn for files in channel_layouts.values() for fn in files],
            details=channel_layouts
        ))

    # 5. Outlier Detection: Loudness (Integrated LUFS)
    valid_lufs = [
        (r.filename, r.loudness.integrated_lufs) 
        for r in valid_results 
        if r.loudness is not None and r.loudness.integrated_lufs is not None and r.loudness.integrated_lufs > -60.0
    ]
    if len(valid_lufs) >= 2:
        lufs_values = [l for _, l in valid_lufs]
        median_lufs = round(statistics.median(lufs_values), 1)
        min_lufs = min(lufs_values)
        max_lufs = max(lufs_values)
        lufs_spread = round(max_lufs - min_lufs, 1)

        # Detect specific track outliers (|track - median| > 3.0 LU)
        loudness_outliers = []
        for filename, lufs in valid_lufs:
            dev = round(abs(lufs - median_lufs), 1)
            if dev >= 3.0:
                loudness_outliers.append((filename, lufs, dev))

        if loudness_outliers:
            for fn, val, dev in loudness_outliers:
                issues.append(ConsistencyIssue(
                    metric="Loudness Outlier",
                    message=f"Potential outlier: '{fn}' has {val} LUFS while the batch median is {median_lufs} LUFS (deviation of {dev} LU).",
                    severity=QCStatus.WARNING,
                    issue_type="OUTLIER",
                    affected_files=[fn],
                    details={
                        "track_lufs": val,
                        "median_lufs": median_lufs,
                        "deviation_lu": dev
                    }
                ))
        elif lufs_spread > 4.0:
            quietest = min(valid_lufs, key=lambda x: x[1])
            loudest = max(valid_lufs, key=lambda x: x[1])
            issues.append(ConsistencyIssue(
                metric="Loudness Uniformity",
                message=f"High loudness spread of {lufs_spread} LU between tracks (quietest: '{quietest[0]}' at {quietest[1]} LUFS; loudest: '{loudest[0]}' at {loudest[1]} LUFS).",
                severity=QCStatus.WARNING,
                issue_type="INCONSISTENCY",
                affected_files=[quietest[0], loudest[0]],
                details={
                    "spread_lu": lufs_spread,
                    "min_lufs": min_lufs,
                    "max_lufs": max_lufs
                }
            ))

    # 6. Outlier Detection: True Peak
    valid_peaks = [
        (r.filename, r.peaks.true_peak_dbtp)
        for r in valid_results
        if r.peaks is not None and r.peaks.true_peak_dbtp is not None
    ]
    if len(valid_peaks) >= 3:
        peak_values = [p for _, p in valid_peaks]
        median_peak = round(statistics.median(peak_values), 2)

        for fn, peak in valid_peaks:
            # If a single track is significantly hotter (> 3.0 dB above median) or exceeding 0 dBTP
            if peak > median_peak + 3.0 or (peak > -0.1 and median_peak < -1.5):
                issues.append(ConsistencyIssue(
                    metric="Peak Outlier",
                    message=f"Potential outlier: '{fn}' has True Peak of {peak} dBTP while the batch median is {median_peak} dBTP.",
                    severity=QCStatus.WARNING,
                    issue_type="OUTLIER",
                    affected_files=[fn],
                    details={
                        "track_peak_dbtp": peak,
                        "median_peak_dbtp": median_peak
                    }
                ))

    # 7. Outlier Detection: Duration
    valid_durations = [
        (r.filename, r.file_info.duration_seconds)
        for r in valid_results
        if r.file_info is not None
    ]
    if len(valid_durations) >= 3:
        durations = [d for _, d in valid_durations]
        median_dur = statistics.median(durations)
        
        for fn, dur in valid_durations:
            # If track is >3.5x longer or <0.25x shorter AND difference is > 30 seconds
            if median_dur > 20.0 and abs(dur - median_dur) > 30.0:
                if dur > median_dur * 3.5 or dur < median_dur * 0.25:
                    issues.append(ConsistencyIssue(
                        metric="Duration Outlier",
                        message=f"Potential outlier: '{fn}' has duration of {round(dur, 1)}s while the batch median is {round(median_dur, 1)}s.",
                        severity=QCStatus.WARNING,
                        issue_type="OUTLIER",
                        affected_files=[fn],
                        details={
                            "track_duration": round(dur, 1),
                            "median_duration": round(median_dur, 1)
                        }
                    ))

    return issues
