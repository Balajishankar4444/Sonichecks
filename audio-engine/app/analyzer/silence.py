import numpy as np
from ..models.results import SilenceResult

def analyze_silence(
    audio_data: np.ndarray, 
    sample_rate: int,
    silence_threshold_db: float = -60.0,
    window_ms: float = 50.0
) -> SilenceResult:
    """
    Detect leading silence, trailing silence, and overall silence using windowed RMS energy.
    """
    if audio_data.size == 0:
        return SilenceResult(
            leading_silence_sec=0.0,
            trailing_silence_sec=0.0,
            total_silence_sec=0.0,
            is_completely_silent=True,
            excessive_silence_detected=True
        )

    # 2D shape: (samples, channels)
    if audio_data.ndim == 1:
        mono = np.abs(audio_data)
    else:
        mono = np.max(np.abs(audio_data), axis=1)

    num_samples = len(mono)
    total_duration_sec = num_samples / sample_rate

    # If peak amplitude is below silence threshold throughout
    peak_linear = np.max(mono)
    threshold_linear = 10.0 ** (silence_threshold_db / 20.0)

    if peak_linear < threshold_linear:
        return SilenceResult(
            leading_silence_sec=round(total_duration_sec, 3),
            trailing_silence_sec=round(total_duration_sec, 3),
            total_silence_sec=round(total_duration_sec, 3),
            is_completely_silent=True,
            excessive_silence_detected=True
        )

    # Calculate frame RMS
    frame_size = max(1, int((window_ms / 1000.0) * sample_rate))
    num_frames = num_samples // frame_size
    if num_frames == 0:
        return SilenceResult(
            leading_silence_sec=0.0,
            trailing_silence_sec=0.0,
            total_silence_sec=0.0,
            is_completely_silent=False,
            excessive_silence_detected=False
        )

    # Reshape frames and compute RMS
    frames = mono[: num_frames * frame_size].reshape(num_frames, frame_size)
    frame_rms = np.sqrt(np.mean(frames ** 2, axis=1))
    
    # Identify non-silent frames
    non_silent_indices = np.where(frame_rms >= threshold_linear)[0]

    if len(non_silent_indices) == 0:
        return SilenceResult(
            leading_silence_sec=round(total_duration_sec, 3),
            trailing_silence_sec=round(total_duration_sec, 3),
            total_silence_sec=round(total_duration_sec, 3),
            is_completely_silent=True,
            excessive_silence_detected=True
        )

    first_active_frame = non_silent_indices[0]
    last_active_frame = non_silent_indices[-1]

    leading_silence_sec = (first_active_frame * frame_size) / sample_rate
    trailing_silence_sec = ((num_frames - 1 - last_active_frame) * frame_size + (num_samples % frame_size)) / sample_rate

    silent_frames_count = num_frames - len(non_silent_indices)
    total_silence_sec = (silent_frames_count * frame_size) / sample_rate

    silence_percentage = (total_silence_sec / total_duration_sec) * 100.0 if total_duration_sec > 0 else 0
    excessive_silence = leading_silence_sec > 2.0 or trailing_silence_sec > 5.0 or (silence_percentage > 45.0 and total_duration_sec > 10.0)

    return SilenceResult(
        leading_silence_sec=round(leading_silence_sec, 3),
        trailing_silence_sec=round(trailing_silence_sec, 3),
        total_silence_sec=round(total_silence_sec, 3),
        is_completely_silent=False,
        excessive_silence_detected=excessive_silence
    )
