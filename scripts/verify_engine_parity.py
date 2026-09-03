import os
import sys
import json
import subprocess
import numpy as np
import soundfile as sf
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Add audio-engine to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "audio-engine"))

from app.analyzer.file_info import extract_file_info
from app.analyzer.loader import load_audio_file
from app.analyzer.peaks import calculate_sample_peak
from app.analyzer.clipping import detect_clipping
from app.analyzer.silence import analyze_silence

TMP_DIR = BASE_DIR / "tmp_parity_fixtures"
TMP_DIR.mkdir(exist_ok=True)

def generate_fixtures():
    fixtures = {}

    # 1. Clean Sine 48kHz 24-bit Stereo
    sr1, dur1 = 48000, 2.0
    t1 = np.linspace(0, dur1, int(sr1 * dur1), endpoint=False)
    tone1 = (0.188 * np.sin(2 * np.pi * 440 * t1)).astype(np.float32)
    st1 = np.column_stack((tone1, tone1))
    p1 = TMP_DIR / "clean_sine_48k_24bit.wav"
    sf.write(str(p1), st1, sr1, subtype='PCM_24')
    fixtures["clean_sine_48k_24bit.wav"] = p1

    # 2. Clipped Audio 44.1kHz 16-bit
    sr2, dur2 = 44100, 1.5
    t2 = np.linspace(0, dur2, int(sr2 * dur2), endpoint=False)
    overloaded = 1.8 * np.sin(2 * np.pi * 200 * t2)
    clipped = np.clip(overloaded, -1.0, 1.0).astype(np.float32)
    st2 = np.column_stack((clipped, clipped))
    p2 = TMP_DIR / "clipped_44k_16bit.wav"
    sf.write(str(p2), st2, sr2, subtype='PCM_16')
    fixtures["clipped_44k_16bit.wav"] = p2

    # 3. Padded Silence
    sr3 = 44100
    lead = np.zeros((int(0.5 * sr3), 2), dtype=np.float32)
    t3 = np.linspace(0, 1.0, int(1.0 * sr3), endpoint=False)
    tone3 = (0.2 * np.sin(2 * np.pi * 1000 * t3)).astype(np.float32)
    active = np.column_stack((tone3, tone3))
    tail = np.zeros((int(1.5 * sr3), 2), dtype=np.float32)
    p3 = TMP_DIR / "padded_silence_44k_16bit.wav"
    sf.write(str(p3), np.vstack((lead, active, tail)), sr3, subtype='PCM_16')
    fixtures["padded_silence_44k_16bit.wav"] = p3

    # 4. Completely Silent
    sr4 = 44100
    sil = np.zeros((int(2.0 * sr4), 2), dtype=np.float32)
    p4 = TMP_DIR / "completely_silent.wav"
    sf.write(str(p4), sil, sr4, subtype='PCM_16')
    fixtures["completely_silent.wav"] = p4

    return fixtures

def run_python_analysis(file_path: Path):
    info = extract_file_info(file_path)
    data, sr = load_audio_file(file_path)
    
    sample_peak_linear, sample_peak_dbfs = calculate_sample_peak(data)
    clipping = detect_clipping(data)
    silence = analyze_silence(data, sr)
    
    # RMS
    rms_linear = float(np.sqrt(np.mean(data ** 2)))
    rms_dbfs = float(round(20.0 * np.log10(rms_linear), 2)) if rms_linear > 1e-6 else -100.0
    dc_offset = float(np.mean(data))

    return {
        "sample_rate": info.sample_rate,
        "bit_depth": info.bit_depth,
        "channels": info.channels,
        "duration_seconds": round(info.duration_seconds, 3),
        "sample_peak_linear": round(sample_peak_linear, 5),
        "sample_peak_dbfs": round(sample_peak_dbfs, 2),
        "rms_linear": round(rms_linear, 5),
        "rms_dbfs": round(rms_dbfs, 2),
        "dc_offset": round(dc_offset, 5),
        "clipping_detected": clipping.clipping_detected,
        "clipped_samples": clipping.clipped_samples,
        "leading_silence_sec": round(silence.leading_silence_sec, 3),
        "trailing_silence_sec": round(silence.trailing_silence_sec, 3),
        "is_completely_silent": silence.is_completely_silent
    }

def run_browser_analysis_via_node(fixtures):
    runner_script = BASE_DIR / "scripts" / "run_ts_analyzer.ts"
    code = f"""
import fs from 'fs';
import path from 'path';
import {{ analyzeWavBuffer }} from '../web/src/lib/audio-engine/analyzer';

async function main() {{
  const results: Record<string, any> = {{}};
  const fixtureDir = {json.dumps(str(TMP_DIR))};
  const files = fs.readdirSync(fixtureDir).filter(f => f.endsWith('.wav'));
  
  for (const file of files) {{
    const filePath = path.join(fixtureDir, file);
    const buffer = fs.readFileSync(filePath).buffer;
    const res = await analyzeWavBuffer(buffer, file);
    results[file] = {{
      sample_rate: res.metadata.sampleRate,
      bit_depth: res.metadata.bitDepth,
      channels: res.metadata.channels,
      duration_seconds: res.metadata.durationSeconds,
      sample_peak_linear: res.samplePeakLinear,
      sample_peak_dbfs: res.samplePeakDbfs,
      rms_linear: res.rmsLinear,
      rms_dbfs: res.rmsDbfs,
      dc_offset: res.dcOffsetLinear,
      clipping_detected: res.clipping.clippingDetected,
      clipped_samples: res.clipping.clippedSamples,
      leading_silence_sec: res.silence.leadingSilenceSec,
      trailing_silence_sec: res.silence.trailingSilenceSec,
      is_completely_silent: res.silence.isCompletelySilent
    }};
  }}
  console.log('---JSON_START---' + JSON.stringify(results) + '---JSON_END---');
}}

main().catch(console.error);
"""
    runner_script.write_text(code, encoding='utf-8')
    
    cmd = ["npx", "tsx", str(runner_script)]
    proc = subprocess.run(cmd, cwd=str(BASE_DIR / "web"), capture_output=True, text=True, shell=True)
    if proc.returncode != 0:
        print("Node error:", proc.stderr)
        raise RuntimeError("TS analyzer failed to execute")
    
    out = proc.stdout
    start = out.find("---JSON_START---") + len("---JSON_START---")
    end = out.find("---JSON_END---")
    return json.loads(out[start:end])

def main():
    print("================================================================================")
    print(" 🔬 SONICHECKS PARITY VERIFICATION: PYTHON REFERENCE vs BROWSER ENGINE")
    print("================================================================================\n")
    
    fixtures = generate_fixtures()
    ts_results = run_browser_analysis_via_node(fixtures)
    
    all_passed = True

    for filename, filepath in fixtures.items():
        print(f"▶ Inspecting Fixture: {filename}")
        py = run_python_analysis(filepath)
        ts = ts_results.get(filename)
        
        if not ts:
            print(f"  ❌ Missing TS result for {filename}")
            all_passed = False
            continue

        metrics = [
            ("Sample Rate", "sample_rate", "exact"),
            ("Bit Depth", "bit_depth", "exact"),
            ("Channels", "channels", "exact"),
            ("Duration (s)", "duration_seconds", 0.01),
            ("Peak Linear", "sample_peak_linear", 0.001),
            ("Peak dBFS", "sample_peak_dbfs", 0.05),
            ("RMS Linear", "rms_linear", 0.005),
            ("RMS dBFS", "rms_dbfs", 0.05),
            ("DC Offset", "dc_offset", 0.001),
            ("Clipping Flag", "clipping_detected", "exact"),
            ("Clipped Samples", "clipped_samples", 15),
            ("Lead Silence (s)", "leading_silence_sec", 0.1),
            ("Tail Silence (s)", "trailing_silence_sec", 0.1),
            ("Silent File Flag", "is_completely_silent", "exact")
        ]

        print(f"  {'Metric':<20} | {'Python Reference':<18} | {'Browser Engine':<18} | {'Status'}")
        print(f"  {'-'*20}-+-{'-'*18}-+-{'-'*18}-+-{'-'*10}")

        for label, key, tol in metrics:
            val_py = py.get(key)
            val_ts = ts.get(key)
            
            status = "✅ PASS"
            if tol == "exact":
                if val_py != val_ts:
                    status = f"❌ MISMATCH ({val_py} != {val_ts})"
                    all_passed = False
            else:
                diff = abs(float(val_py) - float(val_ts))
                if diff > tol:
                    status = f"❌ DIFF {diff:.4f} > {tol}"
                    all_passed = False

            print(f"  {label:<20} | {str(val_py):<18} | {str(val_ts):<18} | {status}")
        print()

    if all_passed:
        print("🎉 ALL METRICS MATCH WITH 100% PARITY AGAINST PYTHON REFERENCE IMPLEMENTATION!")
    else:
        print("❌ Some parity discrepancies were found. Please inspect the log above.")

if __name__ == "__main__":
    main()
