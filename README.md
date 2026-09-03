# 🎚️ Sonichecks — Audio Quality Control, Made Simple

> **Deterministic Audio Quality Control SaaS**  
> Inspect single files or entire multi-track deliveries for LUFS loudness, true peaks, digital clipping, leading/trailing silence, sample rate & bit depth consistency, and delivery standards compliance.

---

## ⚡ Architecture Overview

```text
Next.js 15+ App Router (localhost:3000)
       ↓ (Multi-File / Batch Audio Uploads)
FastAPI Python Microservice (localhost:8000)
       ↓
SoundFile / FFmpeg / NumPy / pyloudnorm / SciPy
       ↓ (Bounded Concurrency Worker Pool: 4 parallel workers)
Deterministic QC Rules Engine (BS.1770-4 / EBU R128)
       ↓
JSON Verdicts + Filter/Search UI + PDF Certificates + CSV Export
```

### 🎯 Key Engineering Guarantees
* **100% Deterministic DSP Analysis**: Pure digital signal processing calculations. No generative LLM hallucinations for audio properties.
* **V1.1 Multi-File Batch Analysis**: Drag and drop up to **50 audio files** at once with dynamic `[ Analyze X Files ]` execution.
* **Controlled Concurrency**: Bounded worker pool (`MAX_CONCURRENT_ANALYSES = 4`) ensures optimal CPU/RAM utilization without overloading the server.
* **Batch Error Isolation**: If one audio file is corrupted or uses an unreadable codec, it does not crash or abort the remaining files in the batch.
* **Live Per-File Progress & Cancel**: Real-time progress tracker (`18 / 32 files analyzed`), individual file status tags, and instant batch cancellation with partial results preservation.
* **Single-File Retry**: Rerun analysis on a failed track without having to re-upload the entire batch.
* **Filter, Search & Sort**: Filter by status (`All`, `Passed`, `Warnings`, `Failed`, `Errors`), search by filename, and sort by name, status, duration, loudness, or peak.
* **Duplicate Detection**: Flags duplicate filenames in the staging queue with a 1-click `Remove Duplicates` action.
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

## ⚙️ Configuration Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `MAX_BATCH_SIZE` | `50` | Maximum number of audio files allowed per upload batch. |
| `MAX_CONCURRENT_ANALYSES` | `4` | Maximum parallel worker threads analyzing audio simultaneously. |
| `MAX_FILE_SIZE_BYTES` | `262144000` | Maximum individual file size limit (250MB). |
| `TEMP_UPLOAD_DIR` | `./tmp_uploads` | Isolated temporary storage directory (auto-purged). |
| `NEXT_PUBLIC_AUDIO_ENGINE_URL` | `http://localhost:8000` | Audio engine microservice URL for Next.js. |

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
Analyze up to 50 audio files concurrently (`files`, `profile_id`) with bounded worker concurrency, individual file error isolation, cross-track consistency warnings, and aggregate batch statistics.

### `POST /api/export/pdf`
Accepts `BatchQCResult` JSON body and returns a downloadable binary `application/pdf` quality control certificate.

### `POST /api/export/csv`
Accepts `BatchQCResult` JSON body and returns a formatted `text/csv` spreadsheet.

### `GET /api/profiles`
Returns all active QC delivery profiles and threshold criteria.

---

## 🔒 Security Architecture
- **MIME & Extension Whitelisting**: Strict extension and header checks.
- **Subprocess Isolation**: Zero shell interpolation (`shell=False`) for FFmpeg/FFprobe invocations.
- **Filename Sanitization**: Safe regex-based removal of path traversal and illegal characters.
- **Immediate Ephemeral Deletion**: All uploaded files are guaranteed deletion via `finally` blocks.

---

## 📄 License
Sonichecks Proprietary &copy; 2026. All rights reserved.
