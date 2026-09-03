import os
import numpy as np
import soundfile as sf
from pathlib import Path

def generate_sample_fixtures():
    out_dir = Path(__file__).resolve().parent / "sample_audio"
    out_dir.mkdir(exist_ok=True)

    # 1. Track 01 - Master Ready (PASS)
    sr1 = 48000
    dur1 = 6.0
    t1 = np.linspace(0, dur1, int(sr1 * dur1), endpoint=False)
    # 440Hz + 880Hz harmonized acoustic-like tone with envelope
    env1 = np.sin(np.pi * t1 / dur1) ** 0.5
    signal1 = 0.18 * np.sin(2 * np.pi * 440 * t1) + 0.08 * np.sin(2 * np.pi * 880 * t1)
    track1 = (signal1 * env1).astype(np.float32)
    stereo1 = np.column_stack((track1, track1))
    sf.write(str(out_dir / "track_01_master_ready_48k24b.wav"), stereo1, sr1, subtype='PCM_24')

    # 2. Track 02 - Clipping & Too Loud (FAIL)
    sr2 = 44100
    dur2 = 5.0
    t2 = np.linspace(0, dur2, int(sr2 * dur2), endpoint=False)
    hot_signal = 1.6 * np.sin(2 * np.pi * 220 * t2) + 0.8 * np.sin(2 * np.pi * 660 * t2)
    clipped2 = np.clip(hot_signal, -1.0, 1.0).astype(np.float32)
    stereo2 = np.column_stack((clipped2, clipped2))
    sf.write(str(out_dir / "track_02_clipping_and_hot.wav"), stereo2, sr2, subtype='PCM_16')

    # 3. Track 03 - Excessive Head/Tail Silence (WARNING)
    sr3 = 48000
    lead_silence = np.zeros((int(2.5 * sr3), 2), dtype=np.float32)
    active_t = np.linspace(0, 3.0, int(3.0 * sr3), endpoint=False)
    active_tone = (0.16 * np.sin(2 * np.pi * 523.25 * active_t)).astype(np.float32)
    active_stereo = np.column_stack((active_tone, active_tone))
    tail_silence = np.zeros((int(4.0 * sr3), 2), dtype=np.float32)
    track3 = np.vstack((lead_silence, active_stereo, tail_silence))
    sf.write(str(out_dir / "track_03_excessive_silence.wav"), track3, sr3, subtype='PCM_24')

    print(f"Generated sample audio files in {out_dir}")

if __name__ == "__main__":
    generate_sample_fixtures()
