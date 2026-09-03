import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
TEMP_UPLOAD_DIR = Path(os.getenv("TEMP_UPLOAD_DIR", BASE_DIR / "tmp_uploads"))
TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Batch & Processing Limits (Centralized Configuration)
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", 50))
MAX_CONCURRENT_ANALYSES = int(os.getenv("MAX_CONCURRENT_ANALYSES", 4))
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", 250 * 1024 * 1024))  # 250MB per file

ALLOWED_EXTENSIONS = {".wav", ".aif", ".aiff", ".flac", ".mp3", ".ogg", ".m4a", ".aac"}
ALLOWED_MIME_TYPES = {
    "audio/wav", "audio/x-wav", "audio/wave",
    "audio/aiff", "audio/x-aiff",
    "audio/flac", "audio/x-flac",
    "audio/mpeg", "audio/mp3",
    "audio/ogg", "audio/x-m4a", "audio/mp4",
    "application/octet-stream"
}

ANALYSIS_TIMEOUT_SECONDS = int(os.getenv("ANALYSIS_TIMEOUT_SECONDS", 120))
