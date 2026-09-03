import io
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.analyzer.file_info import extract_file_info
from app.analyzer.loader import load_audio_file
from app.analyzer.loudness import calculate_loudness
from app.analyzer.peaks import analyze_peaks
from app.analyzer.clipping import detect_clipping
from app.analyzer.silence import analyze_silence
from app.analyzer.consistency import check_batch_consistency
from app.analyzer.qc_engine import get_profile, evaluate_file_qc
from app.models.results import QCStatus
from app.config import MAX_BATCH_SIZE

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "capabilities" in data

def test_profiles_endpoint():
    response = client.get("/api/profiles")
    assert response.status_code == 200
    profiles = response.json()
    assert len(profiles) >= 4
    profile_ids = [p["profile_id"] for p in profiles]
    assert "standard" in profile_ids
    assert "streaming" in profile_ids
    assert "broadcast_ebu" in profile_ids
    assert "acx_audiobook" in profile_ids

def test_clean_sine_wav_analysis(clean_sine_wav: Path):
    # 1. File info
    info = extract_file_info(clean_sine_wav)
    assert info.sample_rate == 48000
    assert info.bit_depth == 24
    assert info.channels == 2
    assert info.channel_layout == "Stereo"
    assert round(info.duration_seconds, 1) == 2.0

    # 2. Audio data & measurements
    data, sr = load_audio_file(clean_sine_wav)
    assert sr == 48000
    assert data.shape[1] == 2

    # Peaks
    peaks = analyze_peaks(data, sr)
    assert -15.0 <= peaks.sample_peak_dbfs <= -14.0
    assert -15.0 <= peaks.true_peak_dbtp <= -14.0

    # Clipping
    clipping = detect_clipping(data)
    assert not clipping.clipping_detected
    assert clipping.clipped_samples == 0

    # QC Evaluation
    profile = get_profile("standard")
    loudness = calculate_loudness(data, sr)
    silence = analyze_silence(data, sr)
    qc_res = evaluate_file_qc("test-id", info, loudness, peaks, clipping, silence, profile)
    
    assert qc_res.filename == "clean_sine_48k_24bit.wav"
    assert qc_res.overall_status in (QCStatus.PASS, QCStatus.WARNING)

def test_clipping_detection(clipped_wav: Path):
    data, sr = load_audio_file(clipped_wav)
    info = extract_file_info(clipped_wav)
    assert info.bit_depth == 16
    assert info.sample_rate == 44100

    clipping = detect_clipping(data)
    assert clipping.clipping_detected is True
    assert clipping.clipped_samples > 100
    assert clipping.consecutive_clipped_runs > 5

    # Peak should be at 0 dBFS
    peaks = analyze_peaks(data, sr)
    assert peaks.sample_peak_dbfs >= -0.01

    profile = get_profile("standard")
    loudness = calculate_loudness(data, sr)
    silence = analyze_silence(data, sr)
    qc_res = evaluate_file_qc("test-id-2", info, loudness, peaks, clipping, silence, profile)
    
    assert qc_res.overall_status == QCStatus.FAIL
    assert any(c.name == "Digital Clipping" and c.status == QCStatus.FAIL for c in qc_res.checks)
    assert any("clipping" in fix.lower() for fix in qc_res.fix_summary)

def test_silence_detection(silence_padded_wav: Path):
    data, sr = load_audio_file(silence_padded_wav)
    silence = analyze_silence(data, sr)
    
    assert not silence.is_completely_silent
    # Leading silence ~0.5s, trailing silence ~1.5s
    assert 0.4 <= silence.leading_silence_sec <= 0.6
    assert 1.4 <= silence.trailing_silence_sec <= 1.6

def test_completely_silent_file(completely_silent_wav: Path):
    data, sr = load_audio_file(completely_silent_wav)
    silence = analyze_silence(data, sr)
    assert silence.is_completely_silent is True

    info = extract_file_info(completely_silent_wav)
    loudness = calculate_loudness(data, sr)
    peaks = analyze_peaks(data, sr)
    clipping = detect_clipping(data)
    profile = get_profile("standard")
    
    qc_res = evaluate_file_qc("silent-id", info, loudness, peaks, clipping, silence, profile)
    assert qc_res.overall_status == QCStatus.FAIL

def test_batch_consistency_warning(clean_sine_wav: Path, clipped_wav: Path):
    # One file is 48k/24bit, one is 44.1k/16bit
    info1 = extract_file_info(clean_sine_wav)
    data1, sr1 = load_audio_file(clean_sine_wav)
    qc1 = evaluate_file_qc("1", info1, calculate_loudness(data1, sr1), analyze_peaks(data1, sr1), detect_clipping(data1), analyze_silence(data1, sr1), get_profile("standard"))

    info2 = extract_file_info(clipped_wav)
    data2, sr2 = load_audio_file(clipped_wav)
    qc2 = evaluate_file_qc("2", info2, calculate_loudness(data2, sr2), analyze_peaks(data2, sr2), detect_clipping(data2), analyze_silence(data2, sr2), get_profile("standard"))

    issues = check_batch_consistency([qc1, qc2])
    assert len(issues) >= 2
    metric_names = [i.metric for i in issues]
    assert "Sample Rate" in metric_names
    assert "Bit Depth" in metric_names

def test_api_single_analyze_upload(clean_sine_wav: Path):
    with open(clean_sine_wav, "rb") as f:
        response = client.post(
            "/api/analyze",
            files={"file": ("clean_sine.wav", f, "audio/wav")},
            data={"profile_id": "streaming"}
        )
    assert response.status_code == 200
    res = response.json()
    assert res["filename"] == "clean_sine.wav"
    assert res["file_info"]["sample_rate"] == 48000
    assert "peaks" in res
    assert "loudness" in res
    assert "checks" in res

def test_api_batch_analyze_and_exports(clean_sine_wav: Path, clipped_wav: Path):
    with open(clean_sine_wav, "rb") as f1, open(clipped_wav, "rb") as f2:
        response = client.post(
            "/api/analyze/batch",
            files=[
                ("files", ("track1.wav", f1, "audio/wav")),
                ("files", ("track2.wav", f2, "audio/wav"))
            ],
            data={"profile_id": "standard"}
        )
    assert response.status_code == 200
    batch_json = response.json()
    assert batch_json["summary"]["total_files"] == 2
    assert len(batch_json["files"]) == 2
    assert len(batch_json["consistency_issues"]) > 0

    # Test PDF Export
    pdf_resp = client.post("/api/export/pdf", json=batch_json)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000

    # Test CSV Export
    csv_resp = client.post("/api/export/csv", json=batch_json)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "track1.wav" in csv_resp.text
    assert "track2.wav" in csv_resp.text

def test_batch_error_isolation_with_corrupted_file(clean_sine_wav: Path):
    """Ensure that 1 corrupted file does not abort or crash the remaining batch."""
    corrupted_bytes = b"RIFF\x00\x00\x00\x00WAVEfmt \x10\x00\x00\x00CORRUPTED_HEADER_DATA"
    with open(clean_sine_wav, "rb") as f_valid:
        response = client.post(
            "/api/analyze/batch",
            files=[
                ("files", ("valid_track.wav", f_valid, "audio/wav")),
                ("files", ("broken_corrupted.wav", io.BytesIO(corrupted_bytes), "audio/wav"))
            ],
            data={"profile_id": "standard"}
        )
    assert response.status_code == 200
    batch_json = response.json()
    assert batch_json["summary"]["total_files"] == 2
    
    valid_res = next(f for f in batch_json["files"] if f["filename"] == "valid_track.wav")
    assert valid_res["overall_status"] in (QCStatus.PASS, QCStatus.WARNING)
    assert valid_res["file_info"] is not None

    broken_res = next(f for f in batch_json["files"] if f["filename"] == "broken_corrupted.wav")
    assert broken_res["overall_status"] == QCStatus.ERROR
    assert broken_res["error_message"] is not None
    assert batch_json["summary"]["errors"] == 1

def test_batch_size_limit():
    """Ensure exceeding MAX_BATCH_SIZE is rejected cleanly."""
    dummy_files = [
        ("files", (f"file_{i}.wav", io.BytesIO(b"RIFFdummy"), "audio/wav"))
        for i in range(MAX_BATCH_SIZE + 1)
    ]
    response = client.post("/api/analyze/batch", files=dummy_files)
    assert response.status_code == 400
    assert "Batch limit exceeded" in response.json()["detail"]
