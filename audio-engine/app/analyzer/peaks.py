import numpy as np
from scipy import signal
from typing import Tuple
from ..models.results import PeakResult

def calculate_sample_peak(audio_data: np.ndarray) -> Tuple[float, float]:
    """Calculate maximum absolute sample value and corresponding dBFS."""
    if audio_data.size == 0:
        return 0.0, -100.0
    
    max_val = float(np.max(np.abs(audio_data)))
    if max_val <= 1e-6:
        dbfs = -100.0
    else:
        dbfs = 20.0 * np.log10(max_val)
    
    return round(max_val, 5), round(dbfs, 2)

def calculate_true_peak(audio_data: np.ndarray, sample_rate: int) -> Tuple[float, float]:
    """
    Calculate True Peak (dBTP) according to ITU-R BS.1770-4 recommendations
    by 4x oversampling using polyphase filtering.
    """
    if audio_data.size == 0:
        return 0.0, -100.0
    
    # 2D shape: (samples, channels)
    if audio_data.ndim == 1:
        audio_2d = audio_data[:, np.newaxis]
    else:
        audio_2d = audio_data

    # Oversampling factor: 4x for <= 48kHz, 2x for 96kHz, 1x for 192kHz+
    if sample_rate <= 48000:
        up_factor = 4
    elif sample_rate <= 96000:
        up_factor = 2
    else:
        up_factor = 1

    if up_factor == 1:
        max_val = float(np.max(np.abs(audio_2d)))
    else:
        max_val = 0.0
        # Process channel by channel or in blocks to conserve RAM
        num_channels = audio_2d.shape[1]
        for ch in range(num_channels):
            ch_data = audio_2d[:, ch]
            # Polyphase resample with anti-aliasing sinc FIR filter
            # To avoid excessive memory for long audio, process in chunks of 500,000 samples
            chunk_size = 500000
            for start in range(0, len(ch_data), chunk_size):
                chunk = ch_data[start : start + chunk_size]
                if len(chunk) == 0:
                    continue
                try:
                    resampled = signal.resample_poly(chunk, up_factor, 1)
                    ch_max = float(np.max(np.abs(resampled)))
                    if ch_max > max_val:
                        max_val = ch_max
                except Exception:
                    # Fallback to direct max
                    ch_max = float(np.max(np.abs(chunk)))
                    if ch_max > max_val:
                        max_val = ch_max

    if max_val <= 1e-6:
        dbtp = -100.0
    else:
        dbtp = 20.0 * np.log10(max_val)

    return round(max_val, 5), round(dbtp, 2)

def analyze_peaks(audio_data: np.ndarray, sample_rate: int) -> PeakResult:
    sample_peak_linear, sample_peak_dbfs = calculate_sample_peak(audio_data)
    true_peak_linear, true_peak_dbtp = calculate_true_peak(audio_data, sample_rate)
    
    # Risk if true peak exceeds 0.0 dBTP or sample peak is within 0.1 dB of 0.0 dBFS
    is_clipping_risk = true_peak_dbtp >= -0.1 or sample_peak_dbfs >= -0.05
    
    return PeakResult(
        sample_peak_dbfs=sample_peak_dbfs,
        true_peak_dbtp=true_peak_dbtp,
        sample_peak_linear=sample_peak_linear,
        true_peak_linear=true_peak_linear,
        is_clipping_risk=is_clipping_risk
    )
