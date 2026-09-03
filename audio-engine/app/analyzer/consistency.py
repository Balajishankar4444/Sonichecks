from typing import List, Dict, Any
from ..models.results import FileQCResult, ConsistencyIssue, QCStatus

def check_batch_consistency(results: List[FileQCResult]) -> List[ConsistencyIssue]:
    # Filter only successfully analyzed files for consistency check
    valid_results = [r for r in results if r.file_info is not None and r.overall_status != QCStatus.ERROR]
    
    if len(valid_results) <= 1:
        return []

    issues: List[ConsistencyIssue] = []

    # 1. Sample Rate Consistency
    sample_rates: Dict[int, List[str]] = {}
    for r in valid_results:
        sr = r.file_info.sample_rate
        sample_rates.setdefault(sr, []).append(r.filename)

    if len(sample_rates) > 1:
        details_str = ", ".join([f"{sr/1000} kHz ({len(files)} files)" for sr, files in sample_rates.items()])
        issues.append(ConsistencyIssue(
            metric="Sample Rate",
            message=f"Sample rate mismatch across files ({details_str}). For consistent delivery, all tracks in a release should share the same sample rate (e.g. 48 kHz or 44.1 kHz).",
            severity=QCStatus.WARNING,
            details={str(k): v for k, v in sample_rates.items()}
        ))

    # 2. Bit Depth Consistency
    bit_depths: Dict[Any, List[str]] = {}
    for r in valid_results:
        bd = r.file_info.bit_depth
        bd_key = f"{bd}-bit" if bd else "Compressed/Unknown"
        bit_depths.setdefault(bd_key, []).append(r.filename)

    if len(bit_depths) > 1:
        details_str = ", ".join([f"{bd} ({len(files)} files)" for bd, files in bit_depths.items()])
        issues.append(ConsistencyIssue(
            metric="Bit Depth",
            message=f"Bit depth variation detected ({details_str}). Consider standardizing to 24-bit or 16-bit across all deliverables.",
            severity=QCStatus.WARNING,
            details=bit_depths
        ))

    # 3. Channel Layout Consistency
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
            details=channel_layouts
        ))

    # 4. Loudness Uniformity
    valid_lufs = [
        (r.filename, r.loudness.integrated_lufs) 
        for r in valid_results 
        if r.loudness is not None and r.loudness.integrated_lufs is not None and r.loudness.integrated_lufs > -60.0
    ]
    if len(valid_lufs) > 1:
        lufs_values = [l for _, l in valid_lufs]
        min_lufs = min(lufs_values)
        max_lufs = max(lufs_values)
        lufs_spread = max_lufs - min_lufs

        if lufs_spread > 4.0:
            quietest = min(valid_lufs, key=lambda x: x[1])
            loudest = max(valid_lufs, key=lambda x: x[1])
            issues.append(ConsistencyIssue(
                metric="Loudness Uniformity",
                message=f"High loudness spread of {round(lufs_spread, 1)} LU between tracks (quietest: '{quietest[0]}' at {quietest[1]} LUFS; loudest: '{loudest[0]}' at {loudest[1]} LUFS). Listeners will have to adjust volume between tracks.",
                severity=QCStatus.WARNING,
                details={
                    "spread_lu": round(lufs_spread, 1),
                    "min_lufs": min_lufs,
                    "max_lufs": max_lufs
                }
            ))

    return issues
