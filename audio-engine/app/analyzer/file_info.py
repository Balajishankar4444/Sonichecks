import os
import hashlib
import subprocess
import json
from pathlib import Path
from typing import Optional, Tuple
import soundfile as sf
from ..models.results import AudioFileInfo

def calculate_file_sha256(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def get_channel_layout_name(channels: int) -> str:
    if channels == 1:
        return "Mono"
    elif channels == 2:
        return "Stereo"
    elif channels == 6:
        return "5.1 Surround"
    elif channels == 8:
        return "7.1 Surround"
    return f"{channels} Channels"

def get_bit_depth_from_subtype(subtype: str) -> Optional[int]:
    subtype_upper = subtype.upper()
    if "PCM_16" in subtype_upper or "16" in subtype_upper:
        return 16
    elif "PCM_24" in subtype_upper or "24" in subtype_upper:
        return 24
    elif "PCM_32" in subtype_upper or "FLOAT" in subtype_upper or "32" in subtype_upper:
        return 32
    elif "PCM_U8" in subtype_upper or "PCM_S8" in subtype_upper or "8" in subtype_upper:
        return 8
    return None

def probe_with_ffprobe(file_path: Path) -> Optional[dict]:
    """Fallback to ffprobe for formats not natively read by libsndfile (e.g. MP3, AAC, M4A)."""
    try:
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path)
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception:
        pass
    return None

def extract_file_info(file_path: Path) -> AudioFileInfo:
    filename = file_path.name
    file_size = os.path.getsize(file_path)
    sha256_hash = calculate_file_sha256(file_path)
    
    # Try reading with soundfile first
    try:
        info = sf.info(str(file_path))
        format_name = info.format
        subtype = info.subtype
        sample_rate = int(info.samplerate)
        channels = int(info.channels)
        duration_seconds = float(info.duration)
        num_samples = int(info.frames)
        bit_depth = get_bit_depth_from_subtype(subtype)
        
        return AudioFileInfo(
            filename=filename,
            file_size_bytes=file_size,
            format=format_name,
            codec=subtype,
            sample_rate=sample_rate,
            bit_depth=bit_depth,
            channels=channels,
            channel_layout=get_channel_layout_name(channels),
            duration_seconds=round(duration_seconds, 3),
            num_samples=num_samples,
            sha256_hash=sha256_hash
        )
    except Exception:
        # Fallback to ffprobe
        ffprobe_data = probe_with_ffprobe(file_path)
        if ffprobe_data and "streams" in ffprobe_data:
            audio_stream = next((s for s in ffprobe_data["streams"] if s.get("codec_type") == "audio"), None)
            format_info = ffprobe_data.get("format", {})
            if audio_stream:
                sample_rate = int(audio_stream.get("sample_rate", 44100))
                channels = int(audio_stream.get("channels", 2))
                duration = float(audio_stream.get("duration") or format_info.get("duration", 0.0))
                codec_name = audio_stream.get("codec_name", "unknown").upper()
                format_name = format_info.get("format_name", file_path.suffix.lstrip(".")).upper()
                
                # Estimate bit depth if available
                bits_per_sample = audio_stream.get("bits_per_sample") or audio_stream.get("bits_per_raw_sample")
                bit_depth = int(bits_per_sample) if bits_per_sample and int(bits_per_sample) > 0 else None
                
                num_samples = int(duration * sample_rate)
                
                return AudioFileInfo(
                    filename=filename,
                    file_size_bytes=file_size,
                    format=format_name,
                    codec=codec_name,
                    sample_rate=sample_rate,
                    bit_depth=bit_depth,
                    channels=channels,
                    channel_layout=get_channel_layout_name(channels),
                    duration_seconds=round(duration, 3),
                    num_samples=num_samples,
                    sha256_hash=sha256_hash
                )
        
        raise ValueError(f"Unable to read audio metadata for {filename}. File may be corrupted or unsupported.")
