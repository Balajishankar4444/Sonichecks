import pytest
import numpy as np
import soundfile as sf
import tempfile
from pathlib import Path

@pytest.fixture
def clean_sine_wav(tmp_path: Path) -> Path:
    """Generate a clean 48kHz, 24-bit stereo sine wave with -14.5 LUFS loudness and peak at -2.0 dBFS."""
    sample_rate = 48000
    duration = 2.0
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    freq = 440.0
    # Amplitude 0.188 is ~ -14.5 dBFS / LUFS
    amplitude = 0.188
    tone = (amplitude * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    stereo = np.column_stack((tone, tone))
    
    file_path = tmp_path / "clean_sine_48k_24bit.wav"
    sf.write(str(file_path), stereo, sample_rate, subtype='PCM_24')
    return file_path

@pytest.fixture
def clipped_wav(tmp_path: Path) -> Path:
    """Generate a 44.1kHz, 16-bit stereo file with hard clipping."""
    sample_rate = 44100
    duration = 1.5
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    freq = 200.0
    # Create an overloaded sine that hits 1.8 and is hard clipped at 1.0
    overloaded = 1.8 * np.sin(2 * np.pi * freq * t)
    clipped = np.clip(overloaded, -1.0, 1.0).astype(np.float32)
    stereo = np.column_stack((clipped, clipped))
    
    file_path = tmp_path / "clipped_audio_44k_16bit.wav"
    sf.write(str(file_path), stereo, sample_rate, subtype='PCM_16')
    return file_path

@pytest.fixture
def silence_padded_wav(tmp_path: Path) -> Path:
    """Generate audio with 0.5s leading silence and 1.5s trailing silence."""
    sample_rate = 44100
    lead_silence = np.zeros((int(0.5 * sample_rate), 2), dtype=np.float32)
    
    t = np.linspace(0, 1.0, int(1.0 * sample_rate), endpoint=False)
    tone = 0.2 * np.sin(2 * np.pi * 1000 * t).astype(np.float32)
    active_audio = np.column_stack((tone, tone))
    
    tail_silence = np.zeros((int(1.5 * sample_rate), 2), dtype=np.float32)
    
    full_audio = np.vstack((lead_silence, active_audio, tail_silence))
    file_path = tmp_path / "padded_silence_track.wav"
    sf.write(str(file_path), full_audio, sample_rate, subtype='PCM_16')
    return file_path

@pytest.fixture
def completely_silent_wav(tmp_path: Path) -> Path:
    sample_rate = 44100
    silence = np.zeros((int(2.0 * sample_rate), 2), dtype=np.float32)
    file_path = tmp_path / "completely_silent.wav"
    sf.write(str(file_path), silence, sample_rate, subtype='PCM_16')
    return file_path
