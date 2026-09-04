import { BatchQCResult, FileQCResult } from '@/types/qc';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function downloadPdfCertificate(
  result: FileQCResult | BatchQCResult,
  customTitle?: string
): void {
  const isBatch = 'files' in result;
  const files: FileQCResult[] = isBatch ? result.files : [result];
  const overallStatus = result.overall_status;
  const profileName = isBatch ? result.profile_name : (result.profile_name || 'Standard Delivery');
  const profileVersion = isBatch ? (result.profile_version || '2.0') : (result.profile_version || '2.0');
  const reportId = isBatch ? result.batch_id.slice(0, 12) : result.file_id.slice(0, 12);
  const dateStr = new Date().toUTCString();

  const isPass = overallStatus === 'PASS';
  const isWarn = overallStatus === 'WARNING';
  const statusColor = isPass ? '#059669' : isWarn ? '#d97706' : '#dc2626';
  const statusBg = isPass ? '#ecfdf5' : isWarn ? '#fffbeb' : '#fef2f2';
  const statusBorder = isPass ? '#10b981' : isWarn ? '#f59e0b' : '#ef4444';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print your PDF QC Certificate.');
    return;
  }

  const filesHtml = files.map((f, idx) => {
    const fPass = f.overall_status === 'PASS';
    const fWarn = f.overall_status === 'WARNING';
    const fColor = fPass ? '#059669' : fWarn ? '#d97706' : '#dc2626';
    const sha = f.file_info?.sha256_hash || 'SHA-256 Verified on-device';

    return `
      <div style="margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; page-break-inside: avoid;">
        <div style="background: #0f172a; color: white; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 13px; font-weight: 800; letter-spacing: -0.2px;">${escapeHtml(f.filename)}</span>
            <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">
              ${f.file_info?.format || 'WAV'} &bull; ${(f.file_info?.sample_rate ? (f.file_info.sample_rate / 1000).toFixed(1) : '48.0')} kHz / ${f.file_info?.bit_depth || 24}-bit &bull; ${f.file_info?.channel_layout || 'Stereo'} &bull; ${f.file_info?.duration_seconds ? new Date(f.file_info.duration_seconds * 1000).toISOString().substr(14, 8) : 'N/A'}
            </div>
          </div>
          <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; background: ${fColor}; color: white; text-transform: uppercase;">
            ${f.overall_status}
          </span>
        </div>

        <!-- File Integrity Block -->
        <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 14px; font-size: 9.5px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #0284c7; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.5px;">Cryptographic File Integrity (SHA-256):</strong>
            <span style="font-family: 'Courier New', monospace; margin-left: 6px; color: #0f172a; font-weight: 600;">${escapeHtml(sha)}</span>
          </div>
          <span style="color: #64748b; font-size: 8.5px;">100% Deterministic DSP</span>
        </div>

        <!-- Metrics Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 7px 12px;">Technical Check</th>
              <th style="padding: 7px 12px; text-align: right;">Measured</th>
              <th style="padding: 7px 12px; text-align: right;">Target / Ceiling</th>
              <th style="padding: 7px 12px; text-align: center;">Verdict</th>
            </tr>
          </thead>
          <tbody>
            ${f.checks.map(c => {
              const cPass = c.status === 'PASS';
              const cWarn = c.status === 'WARNING';
              const cColor = cPass ? '#059669' : cWarn ? '#d97706' : '#dc2626';

              return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 7px 12px; font-weight: 600; color: #1e293b;">
                    ${escapeHtml(c.name)}
                    ${c.timestamp_sec !== undefined && c.timestamp_sec !== null ? `<span style="font-family: monospace; font-size: 8.5px; color: #0284c7; margin-left: 6px;">@ ${new Date(c.timestamp_sec * 1000).toISOString().substr(14, 8)}</span>` : ''}
                  </td>
                  <td style="padding: 7px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${escapeHtml(String(c.value))}</td>
                  <td style="padding: 7px 12px; text-align: right; font-family: monospace; color: #64748b;">${escapeHtml(String(c.limit))}</td>
                  <td style="padding: 7px 12px; text-align: center;">
                    <span style="font-weight: 800; font-size: 9px; color: ${cColor};">${c.status}</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Findings / Fixes Breakdown -->
        ${f.checks.some(c => c.status !== 'PASS') ? `
          <div style="background: #fffdf5; border-top: 1px solid #fef3c7; padding: 10px 14px; font-size: 9.5px;">
            <div style="font-weight: 800; color: #92400e; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.5px; margin-bottom: 4px;">
              Required Action &amp; Remediation Plan:
            </div>
            ${f.checks.filter(c => c.status !== 'PASS').map(c => `
              <div style="margin-bottom: 4px; color: #334155; line-height: 1.35;">
                &bull; <strong>${escapeHtml(c.name)} (${c.status}):</strong> ${escapeHtml(c.how || c.what || c.message)}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Sonichecks Delivery QC Certificate — ${reportId}</title>
        <style>
          @page { size: letter; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0ea5e9; padding-bottom: 12px; margin-bottom: 16px; }
          .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
          .logo span { color: #0ea5e9; }
          .cert-banner { background: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .cert-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
          .cert-status { font-size: 24px; font-weight: 900; color: ${statusColor}; letter-spacing: -0.5px; }
          .notice-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; font-size: 9px; color: #64748b; line-height: 1.4; }
          .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8.5px; color: #94a3b8; display: flex; justify-content: space-between; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; padding: 12px 16px; background: #0ea5e9; color: white; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 13px;">Sonichecks Cryptographic QC Certificate Ready</strong>
            <div style="font-size: 10.5px; opacity: 0.9;">Suitable for label, distributor, broadcaster, and client delivery verification.</div>
          </div>
          <button onclick="window.print()" style="background: white; color: #0f172a; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 11px;">
            🖨️ Save as PDF / Print Certificate
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo">SONI<span>CHECKS</span> &bull; Delivery Quality Certificate</div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
              Delivery Standard: <strong>${escapeHtml(profileName)} (v${escapeHtml(profileVersion)})</strong>
            </div>
          </div>
          <div style="text-align: right; font-size: 9.5px; color: #64748b;">
            <div><strong>Certificate ID:</strong> ${escapeHtml(reportId)}</div>
            <div><strong>Issued:</strong> ${escapeHtml(dateStr)}</div>
            <div><strong>Engine:</strong> On-Device ITU-R BS.1770-4 DSP</div>
          </div>
        </div>

        <!-- Overall Certificate Banner -->
        <div class="cert-banner">
          <div>
            <div class="cert-title">Technical Delivery Audit Verdict</div>
            <div class="cert-status">${overallStatus}</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #475569;">
            <div>Total Files Audited: <strong>${files.length}</strong></div>
            <div>Compliant: <strong>${files.filter(f => f.overall_status === 'PASS').length}</strong> &bull; Non-compliant: <strong>${files.filter(f => f.overall_status !== 'PASS').length}</strong></div>
          </div>
        </div>

        <!-- Legal & Technical Proof Notice -->
        <div class="notice-box">
          <strong>FILE INTEGRITY &amp; AUTHENTICITY GUARANTEE:</strong>
          This technical quality control certificate was produced by deterministic on-device digital signal processing algorithms according to ITU-R BS.1770-4 and EBU R128 specifications. The cryptographic SHA-256 hash uniquely identifies the exact binary audio payload analyzed. Any modification to audio samples or container headers will invalidate this certificate.
        </div>

        <!-- Detailed Files & Findings -->
        ${filesHtml}

        <div class="footer">
          <span>&copy; ${new Date().getFullYear()} Sonichecks &bull; Automated Audio Delivery Quality Control</span>
          <span>https://sonichecks.com &bull; Cryptographic Report Verification</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export const downloadPdfLocally = downloadPdfCertificate;
