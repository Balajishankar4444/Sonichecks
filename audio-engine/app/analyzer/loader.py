import os
import subprocess
import numpy as np
import soundfile as sf
from pathlib import Path
from typing import Tuple

def load_audio_file(file_path: Path) -> Tuple[np.ndarray, int]:
    """
    Load any supported audio file (WAV, AIFF, FLAC, MP3, etc.) into a normalized
    float32 numpy array of shape (samples, channels) and return (data, sample_rate).
    """
    # 1. Try native soundfile reading first (very fast for WAV, AIFF, FLAC)
    try:
        data, sample_rate = sf.read(str(file_path), dtype='float32', always_2d=True)
        return data, sample_rate
    except Exception:
        pass

    # 2. Fallback to FFmpeg decoding to raw PCM WAV pipe or temp wav
    try:
        # Convert to 32-bit float raw PCM via ffmpeg stdout pipe
        cmd = [
            "ffmpeg",
            "-v", "quiet",
            "-i", str(file_path),
            "-f", "f32le",
            "-acodec", "pcm_f32le",
            "-"
        ]
        
        # We need sample rate and channel count from ffprobe first
        from .file_info import extract_file_info
        info = extract_file_info(file_path)
        sample_rate = info.sample_rate
        channels = max(1, info.channels)

        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        if proc.returncode != 0 or len(proc.stdout) == 0:
            raise ValueError(f"FFmpeg decoding failed: {proc.stderr.decode('utf-8', errors='ignore')}")

        raw_bytes = proc.stdout
        audio_array = np.frombuffer(raw_bytes, dtype=np.float32)
        
        if channels > 1:
            total_samples = len(audio_array) // channels
            audio_array = audio_array[: total_samples * channels].reshape((total_samples, channels))
        else:
            audio_array = audio_array[:, np.newaxis]

        return audio_array, sample_rate
    except Exception as e:
        raise ValueError(f"Failed to decode audio file '{file_path.name}': {str(e)}")
