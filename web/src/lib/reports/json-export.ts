import { BatchQCResult, FileQCResult } from '@/types/qc';

export function exportQcResultAsJson(result: FileQCResult | BatchQCResult): void {
  const isBatch = 'files' in result;
  const filename = isBatch 
    ? `sonichecks_qc_batch_${result.batch_id.slice(0, 8)}.json`
    : `sonichecks_qc_${result.filename.replace(/\.[^/.]+$/, "")}.json`;

  const payload = {
    schema_version: '1.0.0',
    generator: 'Sonichecks Deterministic Audio Engine',
    exported_at: new Date().toISOString(),
    result
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
