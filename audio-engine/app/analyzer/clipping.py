import numpy as np
from ..models.results import ClippingResult

def detect_clipping(
    audio_data: np.ndarray, 
    threshold_linear: float = 0.9999, 
    min_consecutive_samples: int = 3
) -> ClippingResult:
    """
    Detect hard digital clipping by identifying consecutive samples at or above the threshold.
    """
    if audio_data.size == 0:
        return ClippingResult(
            clipping_detected=False,
            clipped_samples=0,
            consecutive_clipped_runs=0,
            max_consecutive_clipped=0
        )

    # 2D shape: (samples, channels)
    if audio_data.ndim == 1:
        audio_2d = audio_data[:, np.newaxis]
    else:
        audio_2d = audio_data

    total_clipped_samples = 0
    total_runs = 0
    max_run_length = 0

    num_channels = audio_2d.shape[1]
    for ch in range(num_channels):
        channel_data = np.abs(audio_2d[:, ch])
        is_clipped = channel_data >= threshold_linear

        if not np.any(is_clipped):
            continue

        # Find consecutive runs of True values
        diff = np.diff(np.concatenate(([0], is_clipped.view(np.int8), [0])))
        run_starts = np.where(diff == 1)[0]
        run_ends = np.where(diff == -1)[0]
        run_lengths = run_ends - run_starts

        # Filter for runs of at least min_consecutive_samples
        significant_runs = run_lengths[run_lengths >= min_consecutive_samples]
        
        if len(significant_runs) > 0:
            total_runs += len(significant_runs)
            total_clipped_samples += int(np.sum(significant_runs))
            max_run_length = max(max_run_length, int(np.max(significant_runs)))
        elif np.sum(is_clipped) >= 10:
            # If many individual sample hits are near ceiling
            total_clipped_samples += int(np.sum(is_clipped))

    clipping_detected = total_runs > 0 or total_clipped_samples >= 10

    return ClippingResult(
        clipping_detected=clipping_detected,
        clipped_samples=total_clipped_samples,
        consecutive_clipped_runs=total_runs,
        max_consecutive_clipped=max_run_length
    )
