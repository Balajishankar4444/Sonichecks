import numpy as np
import pyloudnorm as pyln
from typing import Tuple, Optional
from ..models.results import LoudnessResult

def calculate_loudness(audio_data: np.ndarray, sample_rate: int) -> LoudnessResult:
    """
    Calculate ITU-R BS.1770-4 loudness metrics using pyloudnorm and windowed analysis.
    audio_data shape: (samples, channels) or (samples,)
    """
    if audio_data.ndim == 1:
        # Convert mono to 2D array (samples, 1)
        audio_2d = audio_data[:, np.newaxis]
    else:
        audio_2d = audio_data

    num_samples = audio_2d.shape[0]
    duration = num_samples / sample_rate

    # If the file is completely silent or almost silent
    max_amp = np.max(np.abs(audio_2d)) if num_samples > 0 else 0
    if max_amp < 1e-6 or duration < 0.1:
        return LoudnessResult(
            integrated_lufs=-70.0,
            short_term_max_lufs=-70.0,
            momentary_max_lufs=-70.0,
            loudness_range_lu=0.0
        )

    try:
        # Pyloudnorm BS.1770-4 meter
        meter = pyln.Meter(sample_rate)
        integrated_lufs = float(meter.integrated_loudness(audio_2d))
        if np.isneginf(integrated_lufs) or np.isnan(integrated_lufs) or integrated_lufs < -70.0:
            integrated_lufs = -70.0
        else:
            integrated_lufs = round(integrated_lufs, 2)
    except Exception:
        integrated_lufs = -70.0

    # Calculate Momentary (400ms) and Short-term (3000ms) maximums if duration allows
    momentary_max_lufs = None
    short_term_max_lufs = None
    loudness_range_lu = None

    try:
        # Momentary window = 400ms (0.4s)
        mom_win = int(0.4 * sample_rate)
        mom_step = int(0.1 * sample_rate)  # 75% overlap
        
        if num_samples >= mom_win and mom_step > 0:
            mom_values = []
            # Sample periodically across file for efficiency if file is very long
            step = mom_step if num_samples < sample_rate * 300 else int(0.5 * sample_rate)
            for i in range(0, num_samples - mom_win + 1, step):
                chunk = audio_2d[i : i + mom_win]
                # Filter chunk using meter's filter
                try:
                    chunk_lufs = meter.integrated_loudness(chunk)
                    if not (np.isneginf(chunk_lufs) or np.isnan(chunk_lufs)):
                        mom_values.append(chunk_lufs)
                except Exception:
                    pass
            
            if mom_values:
                momentary_max_lufs = round(float(np.max(mom_values)), 2)
                
        # Short-term window = 3.0s
        st_win = int(3.0 * sample_rate)
        st_step = int(1.0 * sample_rate)
        if num_samples >= st_win and st_step > 0:
            st_values = []
            for i in range(0, num_samples - st_win + 1, st_step):
                chunk = audio_2d[i : i + st_win]
                try:
                    chunk_lufs = meter.integrated_loudness(chunk)
                    if not (np.isneginf(chunk_lufs) or np.isnan(chunk_lufs)):
                        st_values.append(chunk_lufs)
                except Exception:
                    pass
            
            if st_values:
                short_term_max_lufs = round(float(np.max(st_values)), 2)
                # Estimate Loudness Range (LRA): Difference between 95th and 10th percentile
                if len(st_values) >= 5:
                    p95 = np.percentile(st_values, 95)
                    p10 = np.percentile(st_values, 10)
                    loudness_range_lu = round(float(max(0.0, p95 - p10)), 1)

    except Exception:
        pass

    return LoudnessResult(
        integrated_lufs=integrated_lufs,
        short_term_max_lufs=short_term_max_lufs,
        momentary_max_lufs=momentary_max_lufs,
        loudness_range_lu=loudness_range_lu
    )
