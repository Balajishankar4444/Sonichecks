import { BatchQCResult, FileQCResult, QCProfile } from '@/types/qc';
import { ProductTier } from '@/config/tiers';

export type EngineMode = 'LOCAL' | 'SERVER';

const AUDIO_ENGINE_URL = process.env.NEXT_PUBLIC_AUDIO_ENGINE_URL || 'http://localhost:8000';

export const DEFAULT_QC_PROFILES: QCProfile[] = [
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
      allowed_sample_rates: [44100, 48000],
      allowed_bit_depths: [16, 24, 32],
      min_lufs: -10.0,
      max_lufs: -5.0,
      max_true_peak_dbtp: -0.1,
      allow_clipping: false
    }
  }
];

export async function getQCProfiles(): Promise<QCProfile[]> {
  try {
    const res = await fetch(`${AUDIO_ENGINE_URL}/api/profiles`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(1500) // Fast 1.5s timeout for local microservice
    });
    if (!res.ok) return DEFAULT_QC_PROFILES;
    const remote = await res.json();
    return Array.isArray(remote) && remote.length > 0 ? remote : DEFAULT_QC_PROFILES;
  } catch (err) {
    // Graceful offline fallback
    return DEFAULT_QC_PROFILES;
  }
}

export async function analyzeSingleFile(
  file: File,
  profileId: string,
  signal?: AbortSignal,
  productTier: ProductTier = 'FREE'
): Promise<FileQCResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profile_id', profileId);

  const res = await fetch(`${AUDIO_ENGINE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
    headers: {
      'x-product-tier': productTier
    },
    signal
  });

  if (!res.ok) {
    let errorMsg = `Server error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function analyzeBatchFiles(
  files: File[],
  profileId: string,
  signal?: AbortSignal,
  productTier: ProductTier = 'PRO'
): Promise<BatchQCResult> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('profile_id', profileId);

  const res = await fetch(`${AUDIO_ENGINE_URL}/api/analyze/batch`, {
    method: 'POST',
    body: formData,
    headers: {
      'x-product-tier': productTier
    },
    signal
  });

  if (!res.ok) {
    let errorMsg = `Batch analysis failed: HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function downloadPdfReport(
  batchResult: BatchQCResult,
  productTier: ProductTier = 'PRO'
): Promise<void> {
  try {
    const res = await fetch(`${AUDIO_ENGINE_URL}/api/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-product-tier': productTier
      },
      body: JSON.stringify(batchResult)
    });

    if (!res.ok) {
      let msg = `PDF Generation failed (HTTP ${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.detail) msg = errJson.detail;
      } catch (_) {}
      throw new Error(msg);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sonichecks_QC_Report_${batchResult.batch_id.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err: any) {
    alert(`Could not download PDF report: ${err.message}`);
  }
}

export async function downloadCsvReport(
  batchResult: BatchQCResult,
  productTier: ProductTier = 'PRO'
): Promise<void> {
  try {
    const res = await fetch(`${AUDIO_ENGINE_URL}/api/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-product-tier': productTier
      },
      body: JSON.stringify(batchResult)
    });

    if (!res.ok) {
      let msg = `CSV Export failed (HTTP ${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.detail) msg = errJson.detail;
      } catch (_) {}
      throw new Error(msg);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sonichecks_Batch_QC_${batchResult.batch_id.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err: any) {
    alert(`Could not download CSV export: ${err.message}`);
  }
}
