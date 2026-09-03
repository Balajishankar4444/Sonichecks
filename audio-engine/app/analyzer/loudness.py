import numpy as np
import pyloudnorm as pyln
from typing import Tuple, Optional
from ..models.results import LoudnessResult

def calculate_loudness(audio_data: np.ndarray, sample_rate: int) -> LoudnessResult:
    """
    Calculate ITU-R BS.1770-4 & EBU Tech 3342 Loudness metrics (Integrated LUFS, Max Momentary, Max Short-Term, LRA).
    audio_data shape: (samples, channels) or (samples,)
    """
    if audio_data.ndim == 1:
        audio_2d = audio_data[:, np.newaxis]
    else:
        audio_2d = audio_data

    num_samples = audio_2d.shape[0]
    duration = num_samples / sample_rate

    # Silent / near-silent files or extremely short files
    max_amp = np.max(np.abs(audio_2d)) if num_samples > 0 else 0
    if max_amp < 1e-6 or duration < 0.1:
        return LoudnessResult(
            integrated_lufs=-70.0,
            short_term_max_lufs=-70.0,
            momentary_max_lufs=-70.0,
            loudness_range_lu=None
        )

    meter = pyln.Meter(sample_rate)

    # 1. Integrated LUFS
    try:
        integrated_lufs = float(meter.integrated_loudness(audio_2d))
        if np.isneginf(integrated_lufs) or np.isnan(integrated_lufs) or integrated_lufs < -70.0:
            integrated_lufs = -70.0
        else:
            integrated_lufs = round(integrated_lufs, 2)
    except Exception:
        integrated_lufs = -70.0

    # 2. Momentary (400ms) Max
    momentary_max_lufs = None
    try:
        mom_win = int(0.4 * sample_rate)
        mom_step = int(0.1 * sample_rate)
        if num_samples >= mom_win and mom_step > 0:
            mom_values = []
            for i in range(0, num_samples - mom_win + 1, mom_step):
                chunk = audio_2d[i : i + mom_win]
                try:
                    c_lufs = meter.integrated_loudness(chunk)
                    if not (np.isneginf(c_lufs) or np.isnan(c_lufs)):
                        mom_values.append(c_lufs)
                except Exception:
                    pass
            if mom_values:
                momentary_max_lufs = round(float(np.max(mom_values)), 2)
    except Exception:
        pass

    # 3. Short-term (3.0s) & LRA (EBU Tech 3342)
    short_term_max_lufs = None
    loudness_range_lu = None

    if duration >= 3.0 and integrated_lufs > -70.0:
        try:
            lra_val = meter.loudness_range(audio_2d)
            if not (np.isnan(lra_val) or np.isinf(lra_val)):
                loudness_range_lu = round(float(max(0.0, lra_val)), 1)
            
            # Short term max from 3s blockwise loudness
            if meter.blockwise_loudness:
                # Valid short-term blocks within actual audio
                valid_st = [x for x in meter.blockwise_loudness if not (np.isneginf(x) or np.isnan(x)) and x > -70.0]
                if valid_st:
                    short_term_max_lufs = round(float(np.max(valid_st)), 2)
        except Exception as e:
            loudness_range_lu = None
            short_term_max_lufs = None

    return LoudnessResult(
        integrated_lufs=integrated_lufs,
        short_term_max_lufs=short_term_max_lufs,
        momentary_max_lufs=momentary_max_lufs,
        loudness_range_lu=loudness_range_lu
    )
