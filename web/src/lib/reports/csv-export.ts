import { BatchQCResult } from '@/types/qc';

export function generateCsvString(batchResult: BatchQCResult): string {
  const headers = [
    'Filename',
    'QC Status',
    'Delivery Profile',
    'Profile Version',
    'Format',
    'Sample Rate (Hz)',
    'Bit Depth',
    'Channels',
    'Duration (sec)',
    'Integrated LUFS',
    'Short-term Max LUFS',
    'Loudness Range (LU)',
    'Sample Peak (dBFS)',
    'True Peak (dBTP)',
    'Clipping Detected',
    'Clipped Samples',
    'Leading Silence (s)',
    'Trailing Silence (s)',
    'SHA-256 Hash',
    'Required Fixes',
    'Notes'
  ];

  const rows: string[][] = [headers];

  for (const f of batchResult.files) {
    const fixes = f.fix_summary ? f.fix_summary.join('; ') : 'None';
    const profileName = f.profile_name || batchResult.profile_name || 'Standard Delivery';
    const profileVersion = f.profile_version || batchResult.profile_version || '2.0';

    if (f.file_info) {
      rows.push([
        escapeCsv(f.filename),
        f.overall_status,
        escapeCsv(profileName),
        escapeCsv(profileVersion),
        f.file_info.format || 'WAV',
        String(f.file_info.sample_rate || 'N/A'),
        f.file_info.bit_depth ? `${f.file_info.bit_depth}-bit` : 'N/A',
        f.file_info.channel_layout || 'Stereo',
        String(f.file_info.duration_seconds?.toFixed(2) || '0.0'),
        f.loudness?.integrated_lufs !== null && f.loudness?.integrated_lufs !== undefined ? String(f.loudness.integrated_lufs) : 'N/A',
        f.loudness?.short_term_max_lufs !== null && f.loudness?.short_term_max_lufs !== undefined ? String(f.loudness.short_term_max_lufs) : 'N/A',
        f.loudness?.loudness_range_lu !== null && f.loudness?.loudness_range_lu !== undefined ? String(f.loudness.loudness_range_lu) : 'N/A',
        f.peaks?.sample_peak_dbfs !== null && f.peaks?.sample_peak_dbfs !== undefined ? String(f.peaks.sample_peak_dbfs) : 'N/A',
        f.peaks?.true_peak_dbtp !== null && f.peaks?.true_peak_dbtp !== undefined ? String(f.peaks.true_peak_dbtp) : 'N/A',
        f.clipping?.clipping_detected ? 'YES' : 'NO',
        String(f.clipping?.clipped_samples || 0),
        String(f.silence?.leading_silence_sec?.toFixed(2) || '0.0'),
        String(f.silence?.trailing_silence_sec?.toFixed(2) || '0.0'),
        f.file_info.sha256_hash || 'N/A',
        escapeCsv(fixes),
        escapeCsv(f.error_message || '')
      ]);
    } else {
      rows.push([
        escapeCsv(f.filename),
        f.overall_status,
        escapeCsv(profileName),
        escapeCsv(profileVersion),
        'Unknown',
        'N/A',
        'N/A',
        'N/A',
        '0.0',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        '0',
        '0.0',
        '0.0',
        'N/A',
        'None',
        escapeCsv(f.error_message || 'Failed to analyze file')
      ]);
    }
  }

  return rows.map(r => r.join(',')).join('\r\n');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsvLocally(batchResult: BatchQCResult): void {
  const csvContent = generateCsvString(batchResult);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sonichecks_QC_Report_${batchResult.batch_id.slice(0, 8)}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
