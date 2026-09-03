export type QCStatus = 'PASS' | 'WARNING' | 'FAIL' | 'ERROR' | 'NOT_CHECKED';

export interface AudioFileInfo {
  filename: string;
  file_size_bytes: number;
  format: string;
  codec?: string | null;
  sample_rate: number;
  bit_depth?: number | null;
  channels: number;
  channel_layout: string;
  duration_seconds: number;
  num_samples: number;
  sha256_hash?: string | null;
}

export interface LoudnessResult {
  integrated_lufs?: number | null;
  short_term_max_lufs?: number | null;
  momentary_max_lufs?: number | null;
  loudness_range_lu?: number | null;
}

export interface PeakResult {
  sample_peak_dbfs: number;
  true_peak_dbtp: number;
  sample_peak_linear: number;
  true_peak_linear: number;
  is_clipping_risk: boolean;
}

export interface ClippingResult {
  clipping_detected: boolean;
  clipped_samples: number;
  consecutive_clipped_runs: number;
  max_consecutive_clipped: number;
}

export interface SilenceResult {
  leading_silence_sec: number;
  trailing_silence_sec: number;
  total_silence_sec: number;
  is_completely_silent: boolean;
  excessive_silence_detected: boolean;
}

export interface QCRuleCheck {
  name: string;
  status: QCStatus;
  value: any;
  limit: any;
  unit?: string | null;
  message: string;
  fix_recommendation?: string | null;
}

export interface FileQCResult {
  file_id: string;
  filename: string;
  file_info?: AudioFileInfo | null;
  loudness?: LoudnessResult | null;
  peaks?: PeakResult | null;
  clipping?: ClippingResult | null;
  silence?: SilenceResult | null;
  checks: QCRuleCheck[];
  overall_status: QCStatus;
  fix_summary: string[];
  error_message?: string | null;
}

export interface ConsistencyIssue {
  metric: string;
  message: string;
  severity: QCStatus;
  issue_type?: 'INCONSISTENCY' | 'OUTLIER' | 'PROFILE_VIOLATION';
  affected_files?: string[];
  details: Record<string, any>;
}

export interface BatchSummary {
  total_files: number;
  passed: number;
  warnings: number;
  failed: number;
  errors: number;
  avg_lufs?: number | null;
  highest_true_peak_dbtp?: number | null;
  total_duration_seconds: number;
  batch_health?: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL_ISSUES';
  batch_health_reasons?: string[];
}

export interface BatchQCResult {
  batch_id: string;
  created_at: string;
  profile_id: string;
  profile_name: string;
  files: FileQCResult[];
  consistency_issues: ConsistencyIssue[];
  summary: BatchSummary;
  overall_status: QCStatus;
}

export interface QCProfileRules {
  allowed_sample_rates?: number[] | null;
  allowed_bit_depths?: number[] | null;
  allowed_channels?: number[] | null;
  min_lufs?: number | null;
  max_lufs?: number | null;
  target_lufs_tolerance?: number | null;
  max_true_peak_dbtp?: number | null;
  max_sample_peak_dbfs?: number | null;
  allow_clipping: boolean;
  max_leading_silence_sec?: number | null;
  min_leading_silence_sec?: number | null;
  max_trailing_silence_sec?: number | null;
  min_trailing_silence_sec?: number | null;
  max_total_silence_percent?: number | null;
}

export interface QCProfile {
  profile_id: string;
  name: string;
  description: string;
  category: string;
  rules: QCProfileRules;
}
