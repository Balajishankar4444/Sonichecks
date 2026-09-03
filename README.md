# 🎚️ Sonichecks — Audio Quality Control, Made Simple

> **Deterministic Audio Quality Control SaaS**  
> Inspect audio deliverables for LUFS loudness, true peaks, digital clipping, leading/trailing silence, sample rate & bit depth consistency, and delivery standards compliance.

---

## ⚡ Architecture Overview

```text
Next.js 15+ App Router (localhost:3000)
       ↓ (Multipart Audio Uploads)
FastAPI Python Microservice (localhost:8000)
       ↓
SoundFile / FFmpeg / NumPy / pyloudnorm / SciPy
       ↓
Deterministic QC Rules Engine (BS.1770-4 / EBU R128)
       ↓
JSON Verdicts + Branded PDF Certificates + CSV Export
```

### 🎯 Key Engineering Guarantees
* **100% Deterministic DSP Analysis**: Pure digital signal processing calculations. No generative LLM hallucinations for audio properties.
* **ITU-R BS.1770-4 & EBU R128 Compliant**: Integrated LUFS, Short-term max, Momentary max, and Loudness Range (LRA).
* **4x Polyphase True Peak Oversampling**: Inter-sample peaks accurately measured in dBTP.
* **Hard Flat-Top Clipping Run Detection**: Detects consecutive full-scale samples hitting digital 0 dBFS.
* **Ephemeral Data Isolation**: Uploaded audio files are stored in isolated temporary directories and purged immediately after processing.

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
* **Node.js**: `v20+` or `v24+`
* **Python**: `3.10+` or `3.12+`
* **FFmpeg**: Installed and available in your system `PATH` (e.g. `ffmpeg -version`)

---

### 2. Starting the Python Audio Engine

In Windows PowerShell:
```powershell
cd audio-engine
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

In Linux / macOS:
```bash
cd audio-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* API Swagger Documentation: `http://localhost:8000/docs`
* API Health Check: `http://localhost:8000/api/health`

---

### 3. Starting the Next.js Frontend

In a second terminal window:
```bash
cd web
npm install
npm run dev
```

* Web Application UI: `http://localhost:3000`
* Quality Control Workspace: `http://localhost:3000/check`
* Dashboard: `http://localhost:3000/dashboard`

---

## 🧪 Running Automated Tests

Run the complete deterministic test suite against synthetic WAV fixtures:

```powershell
cd audio-engine
.\.venv\Scripts\Activate.ps1
python -m pytest -v
```

### Generated Sample Audio Files
To generate or re-generate real sample WAV files with known properties (clean master, clipped master, silence-padded track):
```powershell
cd audio-engine
.\.venv\Scripts\Activate.ps1
python generate_samples.py
```
Generated files are saved in `audio-engine/sample_audio/`:
1. `track_01_master_ready_48k24b.wav` (Clean, -14 LUFS, -1.5 dBTP, 48kHz 24-bit stereo) → **PASS**
2. `track_02_clipping_and_hot.wav` (Hard clipped flat tops, -8 LUFS, 44.1kHz 16-bit) → **FAIL**
3. `track_03_excessive_silence.wav` (2.5s leading silence, 4.0s trailing silence) → **WARNING**

---

## 📦 QC Delivery Profiles

| Profile Name | Target LUFS | Max True Peak | Sample Rates | Bit Depths | Intended Delivery |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Delivery** | -18 to -12 LUFS | -1.0 dBTP | 44.1k, 48k, 88.2k, 96k | 16, 24, 32-bit | General-purpose digital release |
| **Streaming (Spotify/Apple)** | -16 to -13 LUFS | -1.0 dBTP | 44.1k, 48k | 16, 24-bit | Streaming normalization compliance |
| **Broadcast (EBU R128)** | -24 to -22 LUFS | -1.0 dBTP | 48k | 24-bit | European television & radio broadcast |
| **Audiobook (ACX/Audible)** | -23 to -18 LUFS | -3.0 dBTP | 44.1k | 16, 24-bit | Spoken-word ACX specification |
| **Club / DJ Master** | -10 to -6 LUFS | -0.1 dBTP | 44.1k, 48k, 96k | 16, 24, 32-bit | High-energy club and DJ tracks |

---

## 📑 API Reference

### `POST /api/analyze`
Analyze a single audio file with multipart form data (`file`, `profile_id`).

### `POST /api/analyze/batch`
Analyze multiple audio files concurrently (`files`, `profile_id`), calculate multi-track consistency issues, and produce global batch metrics.

### `POST /api/export/pdf`
Accepts `BatchQCResult` JSON body and returns a downloadable binary `application/pdf` quality control certificate.

### `POST /api/export/csv`
Accepts `BatchQCResult` JSON body and returns a formatted `text/csv` spreadsheet.

### `GET /api/profiles`
Returns all active QC delivery profiles and threshold criteria.

---

## 🔒 Security Architecture
- **MIME & Extension Whitelisting**: WAV, AIFF, FLAC, MP3 with strict header validation.
- **Subprocess Isolation**: Zero shell interpolation (`shell=False`) for FFmpeg/FFprobe invocations.
- **Filename Sanitization**: Removal of directory traversal patterns, null bytes, and non-printable characters.
- **Memory & Storage Quotas**: Chunked file streaming with hard 250MB per-file limits.

---

## 📄 License
Sonichecks Proprietary &copy; 2026. All rights reserved.
