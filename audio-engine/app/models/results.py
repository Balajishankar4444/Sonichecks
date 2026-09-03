from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class QCStatus(str, Enum):
    PASS = "PASS"
    WARNING = "WARNING"
    FAIL = "FAIL"
    ERROR = "ERROR"
    NOT_CHECKED = "NOT_CHECKED"

class AudioFileInfo(BaseModel):
    filename: str
    file_size_bytes: int
    format: str
    codec: Optional[str] = None
    sample_rate: int
    bit_depth: Optional[int] = None
    channels: int
    channel_layout: str  # "Mono", "Stereo", "5.1 Surround", etc.
    duration_seconds: float
    num_samples: int

class LoudnessResult(BaseModel):
    integrated_lufs: Optional[float] = None
    short_term_max_lufs: Optional[float] = None
    momentary_max_lufs: Optional[float] = None
    loudness_range_lu: Optional[float] = None  # LRA

class PeakResult(BaseModel):
    sample_peak_dbfs: float
    true_peak_dbtp: float
    sample_peak_linear: float
    true_peak_linear: float
    is_clipping_risk: bool

class ClippingResult(BaseModel):
    clipping_detected: bool
    clipped_samples: int
    consecutive_clipped_runs: int
    max_consecutive_clipped: int

class SilenceResult(BaseModel):
    leading_silence_sec: float
    trailing_silence_sec: float
    total_silence_sec: float
    is_completely_silent: bool
    excessive_silence_detected: bool

class QCRuleCheck(BaseModel):
    name: str
    status: QCStatus
    value: Any
    limit: Any
    unit: Optional[str] = None
    message: str
    fix_recommendation: Optional[str] = None

class FileQCResult(BaseModel):
    file_id: str
    filename: str
    file_info: Optional[AudioFileInfo] = None
    loudness: Optional[LoudnessResult] = None
    peaks: Optional[PeakResult] = None
    clipping: Optional[ClippingResult] = None
    silence: Optional[SilenceResult] = None
    checks: List[QCRuleCheck] = []
    overall_status: QCStatus
    fix_summary: List[str] = []
    error_message: Optional[str] = None

class ConsistencyIssue(BaseModel):
    metric: str
    message: str
    severity: QCStatus
    details: Dict[str, Any]

class BatchSummary(BaseModel):
    total_files: int
    passed: int
    warnings: int
    failed: int
    errors: int = 0
    avg_lufs: Optional[float] = None
    highest_true_peak_dbtp: Optional[float] = None
    total_duration_seconds: float

class BatchQCResult(BaseModel):
    batch_id: str
    created_at: str
    profile_id: str
    profile_name: str
    files: List[FileQCResult]
    consistency_issues: List[ConsistencyIssue]
    summary: BatchSummary
    overall_status: QCStatus

class QCProfileRules(BaseModel):
    allowed_sample_rates: Optional[List[int]] = None  # e.g. [44100, 48000, 96000]
    allowed_bit_depths: Optional[List[int]] = None    # e.g. [16, 24, 32]
    allowed_channels: Optional[List[int]] = None      # e.g. [1, 2]
    min_lufs: Optional[float] = None                  # e.g. -16.0
    max_lufs: Optional[float] = None                  # e.g. -12.0
    target_lufs_tolerance: Optional[float] = None     # e.g. 1.0 (for warning vs fail)
    max_true_peak_dbtp: Optional[float] = -1.0        # e.g. -1.0
    max_sample_peak_dbfs: Optional[float] = -0.1
    allow_clipping: bool = False
    max_leading_silence_sec: Optional[float] = 1.0
    min_leading_silence_sec: Optional[float] = None
    max_trailing_silence_sec: Optional[float] = 3.0
    min_trailing_silence_sec: Optional[float] = None
    max_total_silence_percent: Optional[float] = 40.0

class QCProfile(BaseModel):
    profile_id: str
    name: str
    description: str
    category: str  # "General", "Streaming", "Broadcast", "Audiobook"
    rules: QCProfileRules
