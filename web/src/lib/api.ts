import { BatchQCResult, FileQCResult, QCProfile } from '@/types/qc';

const AUDIO_ENGINE_URL = process.env.NEXT_PUBLIC_AUDIO_ENGINE_URL || 'http://localhost:8000';

export async function getQCProfiles(): Promise<QCProfile[]> {
  try {
    const res = await fetch(`${AUDIO_ENGINE_URL}/api/profiles`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch profiles:', err);
    // Fallback default profiles if backend is starting
    return [
      {
        profile_id: 'standard',
        name: 'Standard Delivery',
        description: 'General-purpose delivery profile for modern digital releases.',
        category: 'General',
        rules: {
          allowed_sample_rates: [44100, 48000, 88200, 96000],
          allowed_bit_depths: [16, 24, 32],
          min_lufs: -18.0,
          max_lufs: -12.0,
          max_true_peak_dbtp: -1.0,
          allow_clipping: false
        }
      },
      {
        profile_id: 'streaming',
        name: 'Streaming (Spotify / Apple Music)',
        description: 'Optimized for online streaming services (-14 LUFS, -1.0 dBTP ceiling).',
        category: 'Streaming',
        rules: {
          allowed_sample_rates: [44100, 48000],
          allowed_bit_depths: [16, 24],
          min_lufs: -16.0,
          max_lufs: -13.0,
          max_true_peak_dbtp: -1.0,
          allow_clipping: false
        }
      },
      {
        profile_id: 'broadcast_ebu',
        name: 'Broadcast (EBU R128)',
        description: 'Strict European broadcast delivery (-23.0 LUFS ±0.5, -1.0 dBTP ceiling).',
        category: 'Broadcast',
        rules: {
          allowed_sample_rates: [48000],
          allowed_bit_depths: [24],
          min_lufs: -24.0,
          max_lufs: -22.0,
          max_true_peak_dbtp: -1.0,
          allow_clipping: false
        }
      },
      {
        profile_id: 'acx_audiobook',
        name: 'Audiobook (ACX / Audible)',
        description: 'Spoken word delivery: -23 to -18 LUFS, -3.0 dBTP ceiling, head/tail silence checks.',
        category: 'Audiobook',
        rules: {
          allowed_sample_rates: [44100],
          allowed_bit_depths: [16, 24],
          min_lufs: -23.0,
          max_lufs: -18.0,
          max_true_peak_dbtp: -3.0,
          allow_clipping: false
        }
      },
      {
        profile_id: 'club_loud',
        name: 'Club / DJ Master',
        description: 'High-energy master profile for club tracks and DJ playback (-9 to -6 LUFS).',
        category: 'Club',
        rules: {
          allowed_sample_rates: [44100, 48000, 96000],
          allowed_bit_depths: [16, 24, 32],
          min_lufs: -10.0,
          max_lufs: -6.0,
          max_true_peak_dbtp: -0.1,
          allow_clipping: false
        }
      }
    ];
  }
}

export async function analyzeSingleFile(
  file: File,
  profileId: string = 'standard',
  signal?: AbortSignal
): Promise<FileQCResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profile_id', profileId);

  const res = await fetch(`${AUDIO_ENGINE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
    signal
  });

  if (!res.ok) {
    let errorDetail = `Failed to analyze ${file.name}.`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {}
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function analyzeBatchFiles(
  files: File[],
  profileId: string = 'standard',
  signal?: AbortSignal
): Promise<BatchQCResult> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('profile_id', profileId);

  const res = await fetch(`${AUDIO_ENGINE_URL}/api/analyze/batch`, {
    method: 'POST',
    body: formData,
    signal
  });

  if (!res.ok) {
    let errorDetail = 'Failed to analyze audio batch.';
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {}
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function downloadPdfReport(batchResult: BatchQCResult): Promise<void> {
  const res = await fetch(`${AUDIO_ENGINE_URL}/api/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchResult)
  });

  if (!res.ok) throw new Error('Failed to generate PDF report.');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sonichecks_report_${batchResult.batch_id.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadCsvReport(batchResult: BatchQCResult): Promise<void> {
  const res = await fetch(`${AUDIO_ENGINE_URL}/api/export/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchResult)
  });

  if (!res.ok) throw new Error('Failed to export CSV.');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sonichecks_qc_${batchResult.batch_id.slice(0, 8)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
