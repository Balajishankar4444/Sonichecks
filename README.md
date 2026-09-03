# 🎚️ Sonichecks — Audio Quality Control, Made Simple

> **Deterministic Audio Quality Control SaaS**  
> Inspect single master files or multi-track batch deliveries for ITU-R BS.1770-4 LUFS loudness, 4x polyphase True Peaks, digital clipping, leading/trailing silence, multi-file consistency, and delivery standards compliance.

---

## 💎 Product Tiers & Feature Boundaries

| Feature / Limit | Free (€0/mo) | Pro (€4.99/mo) *(Recommended)* | Studio (€14.99/mo) |
| :--- | :---: | :---: | :---: |
| **Monthly File Checks** | 5 files / month | 100 files / month | 500 files / month |
| **Max Batch Size** | Single-file only (1) | Up to 50 files / batch | Up to 200 files / batch |
| **Deterministic DSP Analysis** | ✅ Genuine (BS.1770-4) | ✅ Genuine (BS.1770-4) | ✅ Genuine (BS.1770-4) |
| **Format, LUFS, Peak, Silence** | ✅ Included | ✅ Included | ✅ Included |
| **PASS / WARNING / FAIL Fixes** | ✅ Included | ✅ Included | ✅ Included |
| **Batch QC Comparison Matrix** | ❌ (Pro Required) | ✅ Included | ✅ Included |
| **PDF QC Certificate** | ❌ (Pro Required) | ✅ Included (SHA-256) | ✅ Included (SHA-256) |
| **CSV Export** | ❌ (Pro Required) | ✅ Included | ✅ Included |
| **QC History & Saved Runs** | ❌ (Pro Required) | ✅ Included | ✅ Included |
| **Custom QC Profiles** | ❌ (Pro Required) | ✅ Included | ✅ Included |
| **Projects & Client Organization**| ❌ (Studio Required) | ❌ (Studio Required) | ✅ Included |
| **Priority Processing** | Standard | Standard | ✅ Priority Queue |

> **Core Engine Rule:** Free users always receive real, deterministic DSP signal processing. Paid tiers unlock higher file volume, batch capabilities, matrix comparisons, PDF certificates, history, and project management.

---

## ⚡ Architecture Overview

```text
Next.js 15+ App Router (localhost:3000)
       ↓ (Single File or Batch Audio Uploads + Tier Enforcement)
FastAPI Python Microservice (localhost:8000)
       ↓
SoundFile / FFmpeg / NumPy / pyloudnorm / SciPy / hashlib
       ↓ (Bounded Concurrency: 4 parallel workers)
Deterministic QC Rules Engine (BS.1770-4 / EBU R128)
       ↓
JSON Verdicts + Batch Matrix + SHA-256 Certificates + CSV Export
```

---

## 🚀 Quick Start (Development)

### 1. Python Audio Engine
```powershell
cd audio-engine
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* API Health Check: `http://localhost:8000/api/health`
* Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Next.js Web Application
```bash
cd web
npm install
npm run dev
```
* Application: `http://localhost:3000`
* QC Workspace: `http://localhost:3000/check`
* Pricing Page: `http://localhost:3000/pricing`
* Dashboard & Projects: `http://localhost:3000/dashboard`

---

## 🧪 Running Automated Tests

```powershell
cd audio-engine
.\.venv\Scripts\Activate.ps1
python -m pytest -v
```
*(All 13 unit and integration tests passing: single file analysis, batch error isolation, tier limit enforcement, SHA-256 computation, and export permissions).*

---

## 📄 License
Sonichecks Proprietary &copy; 2026. All rights reserved.
