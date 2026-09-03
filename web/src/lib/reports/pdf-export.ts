import { BatchQCResult } from '@/types/qc';

export function downloadPdfLocally(batchResult: BatchQCResult): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print your PDF inspection certificate.');
    return;
  }

  const isPass = batchResult.overall_status === 'PASS';
  const isWarn = batchResult.overall_status === 'WARNING';
  const statusColor = isPass ? '#10b981' : isWarn ? '#f59e0b' : '#ef4444';
  const statusBg = isPass ? '#ecfdf5' : isWarn ? '#fffbeb' : '#fef2f2';

  const rowsHtml = batchResult.files.map((f, idx) => {
    const filePass = f.overall_status === 'PASS';
    const fileWarn = f.overall_status === 'WARNING';
    const rowColor = filePass ? '#10b981' : fileWarn ? '#f59e0b' : '#ef4444';
    const fullHash = f.file_info?.sha256_hash || 'N/A';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 10px 8px; font-weight: 600; color: #1e293b;">
          <div style="font-size: 11px; font-weight: 700; color: #0f172a;">${escapeHtml(f.filename)}</div>
          <div style="margin-top: 4px; font-family: 'Courier New', Courier, monospace; font-size: 8.5px; color: #334155; background: #f8fafc; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0; word-break: break-all;">
            <strong style="color: #0284c7;">SHA-256:</strong> ${escapeHtml(fullHash)}
          </div>
        </td>
        <td style="padding: 10px 8px; text-align: center; vertical-align: top;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: ${rowColor}; border: 1px solid ${rowColor};">
            ${f.overall_status}
          </span>
        </td>
        <td style="padding: 10px 8px; text-align: right; font-family: monospace; vertical-align: top;">${f.loudness?.integrated_lufs !== null && f.loudness?.integrated_lufs !== undefined ? `${f.loudness.integrated_lufs} LUFS` : 'N/A'}</td>
        <td style="padding: 10px 8px; text-align: right; font-family: monospace; vertical-align: top;">${f.peaks?.true_peak_dbtp !== null && f.peaks?.true_peak_dbtp !== undefined ? `${f.peaks.true_peak_dbtp} dBTP` : 'N/A'}</td>
        <td style="padding: 10px 8px; text-align: right; font-family: monospace; vertical-align: top;">${f.loudness?.loudness_range_lu !== null && f.loudness?.loudness_range_lu !== undefined ? `${f.loudness.loudness_range_lu} LU` : 'N/A'}</td>
        <td style="padding: 10px 8px; text-align: center; vertical-align: top;">${f.file_info?.sample_rate ? `${(f.file_info.sample_rate / 1000).toFixed(1)}k` : 'N/A'} / ${f.file_info?.bit_depth || 16}b</td>
        <td style="padding: 10px 8px; text-align: center; color: ${f.clipping?.clipping_detected ? '#ef4444' : '#10b981'}; font-weight: bold; vertical-align: top;">
          ${f.clipping?.clipping_detected ? 'YES' : 'Clean'}
        </td>
      </tr>
      ${f.fix_summary && f.fix_summary.length > 0 ? `
        <tr style="background: #f8fafc; font-size: 10px; color: #475569;">
          <td colspan="7" style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #0ea5e9;">Fixes Required:</strong> ${f.fix_summary.map(escapeHtml).join(' &bull; ')}
          </td>
        </tr>
      ` : ''}
    `;
  }).join('');

  const clippingCount = batchResult.files.filter(f => f.clipping?.clipping_detected).length;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Sonichecks QC Certificate — ${batchResult.batch_id.slice(0, 8)}</title>
        <style>
          @page { size: letter; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
          .logo span { color: #0ea5e9; }
          .meta { text-align: right; font-size: 10px; color: #64748b; }
          .summary-card { background: ${statusBg}; border: 1.5px solid ${statusColor}; border-radius: 8px; padding: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .summary-status { font-size: 18px; font-weight: 800; color: ${statusColor}; }
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
          .metric-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .metric-value { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #0f172a; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; padding: 10px; background: #0ea5e9; color: white; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Sonichecks Cryptographic QC Certificate Ready</strong></span>
          <button onclick="window.print()" style="background: white; color: #0f172a; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer;">
            🖨️ Save as PDF / Print
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo">SONI<span>CHECKS</span> &bull; Cryptographic QC Certificate</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Profile: <strong>${escapeHtml(batchResult.profile_name || 'Standard Delivery')}</strong> &bull; Batch: <strong>${batchResult.batch_id.slice(0, 8)}</strong>
            </div>
          </div>
          <div class="meta">
            <div><strong>Date:</strong> ${new Date(batchResult.created_at).toLocaleDateString()} ${new Date(batchResult.created_at).toLocaleTimeString()}</div>
            <div><strong>Engine:</strong> Local Browser DSP (Deterministic)</div>
          </div>
        </div>

        <div class="summary-card">
          <div>
            <div class="summary-status">${batchResult.overall_status}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              ${batchResult.summary.passed} of ${batchResult.summary.total_files} files passed all quality control thresholds.
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div>Total Duration: <strong>${batchResult.summary.total_duration_seconds.toFixed(1)}s</strong></div>
            <div>Files Analyzed: <strong>${batchResult.summary.total_files}</strong></div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-box">
            <div class="metric-label">Average Loudness</div>
            <div class="metric-value">${batchResult.summary.avg_lufs !== null && batchResult.summary.avg_lufs !== undefined ? `${batchResult.summary.avg_lufs} LUFS` : 'N/A'}</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Max True Peak</div>
            <div class="metric-value">${batchResult.summary.highest_true_peak_dbtp !== null && batchResult.summary.highest_true_peak_dbtp !== undefined ? `${batchResult.summary.highest_true_peak_dbtp} dBTP` : 'N/A'}</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Clipping Detected</div>
            <div class="metric-value" style="color: ${clippingCount > 0 ? '#ef4444' : '#10b981'};">
              ${clippingCount} file(s)
            </div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Failed Files</div>
            <div class="metric-value" style="color: ${batchResult.summary.failed > 0 ? '#ef4444' : '#10b981'};">
              ${batchResult.summary.failed}
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; color: #1e293b; margin: 15px 0 5px 0;">Track Inspection Details &amp; SHA-256 Signatures</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align: left; width: 45%;">Track Filename &amp; Full SHA-256 Hash</th>
              <th style="width: 10%;">Status</th>
              <th style="text-align: right; width: 10%;">LUFS</th>
              <th style="text-align: right; width: 10%;">True Peak</th>
              <th style="text-align: right; width: 9%;">LRA</th>
              <th style="width: 8%;">Format</th>
              <th style="width: 8%;">Clipping</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Cryptographically validated by Sonichecks Browser Audio Engine.</div>
          <div>Page 1 of 1 &bull; Verification Batch: ${batchResult.batch_id}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
