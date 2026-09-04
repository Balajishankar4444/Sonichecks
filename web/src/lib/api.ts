import { BatchQCResult, FileQCResult, QCProfile } from '@/types/qc';
import { ProductTier } from '@/config/tiers';
import { DELIVERY_STANDARDS } from '@/config/delivery-standards';

export type EngineMode = 'LOCAL' | 'SERVER';

const AUDIO_ENGINE_URL = process.env.NEXT_PUBLIC_AUDIO_ENGINE_URL || 'http://localhost:8000';

export const DEFAULT_QC_PROFILES: QCProfile[] = DELIVERY_STANDARDS;

export async function getQCProfiles(): Promise<QCProfile[]> {
  return DEFAULT_QC_PROFILES;
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

import { downloadPdfLocally } from './reports/pdf-export';
import { downloadCsvLocally } from './reports/csv-export';

export async function downloadPdfReport(
  batchResult: BatchQCResult,
  productTier: ProductTier = 'PRO'
): Promise<void> {
  try {
    downloadPdfLocally(batchResult);
  } catch (err: any) {
    alert(`Could not generate PDF certificate: ${err.message}`);
  }
}

export async function downloadCsvReport(
  batchResult: BatchQCResult,
  productTier: ProductTier = 'PRO'
): Promise<void> {
  try {
    downloadCsvLocally(batchResult);
  } catch (err: any) {
    alert(`Could not generate CSV export: ${err.message}`);
  }
}
