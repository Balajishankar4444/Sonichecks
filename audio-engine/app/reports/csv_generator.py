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
        "Required Fixes",
        "Error / Notes"
    ]
    writer.writerow(headers)

    for f in batch_result.files:
        fixes = "; ".join(f.fix_summary) if f.fix_summary else "None"
        if f.file_info is not None:
            row = [
                f.filename,
                f.overall_status.value,
                f.file_info.format,
                f.file_info.sample_rate,
                f"{f.file_info.bit_depth}-bit" if f.file_info.bit_depth else "N/A",
                f.file_info.channel_layout,
                f.file_info.duration_seconds,
                f.loudness.integrated_lufs if f.loudness and f.loudness.integrated_lufs is not None else "N/A",
                f.loudness.short_term_max_lufs if f.loudness and f.loudness.short_term_max_lufs is not None else "N/A",
                f.peaks.sample_peak_dbfs if f.peaks else "N/A",
                f.peaks.true_peak_dbtp if f.peaks else "N/A",
                ("YES" if f.clipping.clipping_detected else "NO") if f.clipping else "N/A",
                f.clipping.clipped_samples if f.clipping else 0,
                f.silence.leading_silence_sec if f.silence else 0.0,
                f.silence.trailing_silence_sec if f.silence else 0.0,
                fixes,
                f.error_message or ""
            ]
        else:
            row = [
                f.filename,
                f.overall_status.value,
                "Unknown",
                "N/A",
                "N/A",
                "N/A",
                0.0,
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                0,
                0.0,
                0.0,
                "None",
                f.error_message or "Failed to analyze file"
            ]
        writer.writerow(row)

    return output.getvalue()
