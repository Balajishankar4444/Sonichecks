import csv
import io
from typing import List
from ..models.results import BatchQCResult

def generate_csv_report(batch_result: BatchQCResult) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    # Headers
    headers = [
        "Filename",
        "QC Status",
        "Format",
        "Sample Rate (Hz)",
        "Bit Depth",
        "Channels",
        "Duration (sec)",
        "Integrated LUFS",
        "Short-term Max LUFS",
        "Sample Peak (dBFS)",
        "True Peak (dBTP)",
        "Clipping Detected",
        "Clipped Samples",
        "Leading Silence (s)",
        "Trailing Silence (s)",
        "Required Fixes"
    ]
    writer.writerow(headers)

    for f in batch_result.files:
        fixes = "; ".join(f.fix_summary) if f.fix_summary else "None"
        row = [
            f.filename,
            f.overall_status.value,
            f.file_info.format,
            f.file_info.sample_rate,
            f"{f.file_info.bit_depth}-bit" if f.file_info.bit_depth else "N/A",
            f.file_info.channel_layout,
            f.file_info.duration_seconds,
            f.loudness.integrated_lufs if f.loudness.integrated_lufs is not None else "N/A",
            f.loudness.short_term_max_lufs if f.loudness.short_term_max_lufs is not None else "N/A",
            f.peaks.sample_peak_dbfs,
            f.peaks.true_peak_dbtp,
            "YES" if f.clipping.clipping_detected else "NO",
            f.clipping.clipped_samples,
            f.silence.leading_silence_sec,
            f.silence.trailing_silence_sec,
            fixes
        ]
        writer.writerow(row)

    return output.getvalue()
