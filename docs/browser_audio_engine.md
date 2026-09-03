# 🌐 Sonichecks Browser-Side Audio Analysis Engine (V1 Prototype)

## 1. Overview & Architecture

The **Sonichecks Browser Audio Engine** executes deterministic digital signal processing (DSP) quality control directly on the client device inside a dedicated **Web Worker**.

```text
                                Sonichecks Workspace
                                         |
                       ┌─────────────────┴─────────────────┐
                       |                                   |
           Local Browser Engine                 Python / FastAPI Reference
             (Web Worker DSP)                     (Microservice Engine)
                       |                                   |
              Local File Reading                   Chunked Upload API
                       |                                   |
             Typed Array Parsing                  SoundFile / Librosa
                       |                                   |
           Deterministic DSP Metrics              ITU-R BS.1770-4 LUFS
                       |                                   |
                       └─────────────────┬─────────────────┘
                                         |
                              Unified FileQCResult UI
```

### Security & Privacy Guarantee
When using the Local Browser Engine, audio files **never leave the user's computer**. The binary sample data is processed locally in browser memory and discarded after analysis. Only local verdicts and reports are rendered on screen.

---

## 2. Web Worker Architecture & Memory Strategy

To ensure fluid 60 FPS UI responsiveness when analyzing large multi-megabyte master files (up to hundreds of MB):
- **Web Worker Threading**: Parsing and arithmetic run off the React/Next.js UI main thread.
- **Transferable Objects**: `ArrayBuffer` instances are passed via `worker.postMessage({ buffer }, [buffer])` transferring ownership without duplicating memory.
- **Normalized Float32 Streams**: PCM samples are converted to `Float32Array` channels scaled to $[-1.0, 1.0]$.
- **Graceful Fallback**: If Web Workers are disabled or blocked in certain sandboxed environments, the engine falls back to asynchronous chunked processing on the main thread.

---

## 3. Supported Audio Formats (Phase 1)

Phase 1 strictly focuses on **uncompressed PCM WAV containers**:
- **16-bit Signed PCM** (Integer scaling: `1.0 / 32768.0`)
- **24-bit Signed PCM** (Sign-extended 3-byte int scaling: `1.0 / 8388608.0`)
- **32-bit Signed PCM** (Integer scaling: `1.0 / 2147483648.0`)
- **32-bit IEEE Floating Point** (Direct normalized floats)
- **Channel layouts**: Mono, Stereo, and Multi-channel.
- **Sample Rates**: 44.1 kHz, 48 kHz, 88.2 kHz, 96 kHz, 192 kHz.

---

## 4. Deterministic DSP Measurements

| Metric | Calculation Method | Units / Range |
| :--- | :--- | :--- |
| **Duration** | `num_samples / sample_rate` | Seconds |
| **Sample Rate** | Header chunk sample rate | Hz (e.g. 44100, 48000) |
| **Bit Depth** | Header chunk bits per sample | Bits (16, 24, 32) |
| **Channels** | Number of interleaved channels | Channels (1, 2) |
| **Sample Peak Linear** | $\max(|x_i|)$ across all channels | $0.0 \dots 1.0$ |
| **Sample Peak dBFS** | $20 \log_{10}(\text{Sample Peak Linear})$ | dBFS ($-100.0 \dots 0.0$) |
| **RMS Linear** | $\sqrt{\frac{1}{N \cdot C} \sum x^2}$ | $0.0 \dots 1.0$ |
| **RMS dBFS** | $20 \log_{10}(\text{RMS Linear})$ | dBFS |
| **DC Offset** | $\frac{1}{N \cdot C} \sum x$ | Linear & $\%$ offset |
| **Digital Clipping** | Consecutive sample runs $\ge 0.9999$ ($\ge 3$ consecutive) | Count & Run length |
| **Silence Boundaries** | 50ms energy frames $< -60.0\text{ dBFS}$ from start/end | Leading & Trailing sec |
| **SHA-256 Hash** | `crypto.subtle.digest("SHA-256", buffer)` | 64-char hex digest |

---

## 5. Python vs. Browser Parity Verification

The Python/FastAPI microservice serves as the **ground-truth reference implementation**.

Running `python scripts/verify_engine_parity.py` executes both engines against standardized audio fixtures:

```text
▶ Clean Sine Wave (48kHz, 24-bit Stereo, -14.52 dBFS):
  - Sample Rate: Python 48000 | Browser 48000 (0 delta) -> PASS
  - Bit Depth:   Python 24    | Browser 24    (0 delta) -> PASS
  - Peak dBFS:   Python -14.52 | Browser -14.52 (0.00 dB delta) -> PASS
  - RMS dBFS:    Python -17.53 | Browser -17.53 (0.00 dB delta) -> PASS

▶ Clipped Audio (44.1kHz, 16-bit Stereo):
  - Peak dBFS:        Python 0.00  | Browser 0.00  (0.00 dB delta) -> PASS
  - Clipped Samples:  Python 82800 | Browser 82800 (0 delta) -> PASS
  - Clipping Flag:    Python True  | Browser True  -> PASS

▶ Padded Silence (0.5s Head, 1.5s Tail):
  - Lead Silence:  Python 0.500s | Browser 0.500s (0.000s delta) -> PASS
  - Tail Silence:  Python 1.500s | Browser 1.500s (0.000s delta) -> PASS

▶ Completely Silent File:
  - Peak dBFS:    Python -100.0 dBFS | Browser -100.0 dBFS -> PASS
  - Silent Flag:  Python True        | Browser True        -> PASS
```

---

## 6. Phase 2 Roadmap: Porting BS.1770-4 LUFS & True Peak

The next phase will introduce:
1. **K-Weighting Biquad IIR Filter cascade**: Stage 1 high-shelf pre-filter ($\approx +4\text{ dB}$ at $1.5\text{ kHz}$) and Stage 2 high-pass RLB weighting filter ($38\text{ Hz}$).
2. **ITU-R BS.1770-4 Gating**: Gated Momentary (400ms) and Short-term (3s) blocks with $-70\text{ LKFS}$ absolute gate and $-10\text{ LU}$ relative gate for Integrated LUFS.
3. **Polyphase 4x Sinc Resampling**: True Peak inter-sample detection.
