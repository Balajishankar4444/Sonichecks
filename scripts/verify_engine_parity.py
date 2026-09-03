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
from app.analyzer.loudness import calculate_loudness
from app.analyzer.peaks import calculate_sample_peak, calculate_true_peak
from app.analyzer.clipping import detect_clipping
from app.analyzer.silence import analyze_silence

TMP_DIR = BASE_DIR / "tmp_parity_fixtures"
TMP_DIR.mkdir(exist_ok=True)

def generate_fixtures():
    fixtures = {}

    # 1. Constant Sine -14 LUFS (48kHz, 24-bit Stereo, 5.0s)
    sr1, dur1 = 48000, 5.0
    t1 = np.linspace(0, dur1, int(sr1 * dur1), endpoint=False)
    tone1 = (0.188 * np.sin(2 * np.pi * 440 * t1)).astype(np.float32)
    st1 = np.column_stack((tone1, tone1))
    p1 = TMP_DIR / "01_constant_sine_48k_24bit.wav"
    sf.write(str(p1), st1, sr1, subtype='PCM_24')
    fixtures["01_constant_sine_48k_24bit.wav"] = p1

    # 2. Quiet Audio -30 LUFS (44.1kHz, 16-bit Mono, 4.0s)
    sr2, dur2 = 44100, 4.0
    t2 = np.linspace(0, dur2, int(sr2 * dur2), endpoint=False)
    amp_30 = 10 ** ((-30.0 + 0.691) / 20.0)
    tone_30 = (amp_30 * np.sin(2 * np.pi * 1000.0 * t2)).astype(np.float32)
    p2 = TMP_DIR / "02_quiet_30lufs_44k_16bit_mono.wav"
    sf.write(str(p2), tone_30, sr2, subtype='PCM_16')
    fixtures["02_quiet_30lufs_44k_16bit_mono.wav"] = p2

    # 3. Loud Audio -9 LUFS (44.1kHz, 16-bit Stereo, 4.0s)
    amp_9 = 10 ** ((-9.0 + 0.691) / 20.0)
    tone_9 = (amp_9 * np.sin(2 * np.pi * 1000.0 * t2)).astype(np.float32)
    p3 = TMP_DIR / "03_loud_9lufs_44k_16bit.wav"
    sf.write(str(p3), np.column_stack((tone_9, tone_9)), sr2, subtype='PCM_16')
    fixtures["03_loud_9lufs_44k_16bit.wav"] = p3

    # 4. Dynamic Music (48kHz, 24-bit Stereo, 10.0s, Envelope Modulation)
    sr4, dur4 = 48000, 10.0
    t4 = np.linspace(0, dur4, int(sr4 * dur4), endpoint=False)
    env4 = 0.5 * (1.0 + np.sin(2 * np.pi * 0.2 * t4)) # 0.2Hz swell
    music_l = (env4 * (0.3 * np.sin(2*np.pi*150*t4) + 0.2 * np.sin(2*np.pi*1200*t4))).astype(np.float32)
    music_r = (env4 * (0.28 * np.sin(2*np.pi*200*t4) + 0.22 * np.sin(2*np.pi*2500*t4))).astype(np.float32)
    p4 = TMP_DIR / "04_dynamic_music_10s_48k_24bit.wav"
    sf.write(str(p4), np.column_stack((music_l, music_r)), sr4, subtype='PCM_24')
    fixtures["04_dynamic_music_10s_48k_24bit.wav"] = p4

    # 5. Speech Simulation (44.1kHz 16-bit Mono, 6.0s with vocal pauses)
    sr5, dur5 = 44100, 6.0
    t5 = np.linspace(0, dur5, int(sr5 * dur5), endpoint=False)
    vocal = np.zeros_like(t5)
    # Formants during speech bursts
    b1 = (0.3 * np.sin(2*np.pi*300*t5) + 0.2 * np.sin(2*np.pi*1800*t5)) * ((t5 > 0.5) & (t5 < 2.0))
    b2 = (0.25 * np.sin(2*np.pi*400*t5) + 0.15 * np.sin(2*np.pi*2200*t5)) * ((t5 > 3.0) & (t5 < 5.2))
    speech = (b1 + b2).astype(np.float32)
    p5 = TMP_DIR / "05_speech_simulation_6s_44k_mono.wav"
    sf.write(str(p5), speech, sr5, subtype='PCM_16')
    fixtures["05_speech_simulation_6s_44k_mono.wav"] = p5

    # 6. Completely Silent File (48kHz, 24-bit Stereo, 4.0s)
    sil = np.zeros((int(4.0 * sr1), 2), dtype=np.float32)
    p6 = TMP_DIR / "06_digital_silence_48k_24bit.wav"
    sf.write(str(p6), sil, sr1, subtype='PCM_24')
    fixtures["06_digital_silence_48k_24bit.wav"] = p6

    # 7. Near Silence (-65 LUFS, 44.1kHz 16-bit Stereo, 4.0s)
    amp_65 = 10 ** ((-65.0 + 0.691) / 20.0)
    tone_65 = (amp_65 * np.sin(2 * np.pi * 1000.0 * t2)).astype(np.float32)
    p7 = TMP_DIR / "07_near_silence_65lufs_44k.wav"
    sf.write(str(p7), np.column_stack((tone_65, tone_65)), sr2, subtype='PCM_16')
    fixtures["07_near_silence_65lufs_44k.wav"] = p7

    # 8. Hard Clipped Audio (48kHz, 24-bit Stereo, 4.0s)
    overloaded = 1.8 * np.sin(2 * np.pi * 200 * t1[:int(4.0*sr1)])
    clipped = np.clip(overloaded, -1.0, 1.0).astype(np.float32)
    p8 = TMP_DIR / "08_hard_clipped_48k_24bit.wav"
    sf.write(str(p8), np.column_stack((clipped, clipped)), sr1, subtype='PCM_24')
    fixtures["08_hard_clipped_48k_24bit.wav"] = p8

    # 9. 96kHz High-Resolution Master (96kHz, 32-bit Stereo, 5.0s)
    sr9, dur9 = 96000, 5.0
    t9 = np.linspace(0, dur9, int(sr9 * dur9), endpoint=False)
    amp_18 = 10 ** ((-18.0 + 0.691) / 20.0)
    tone_96k = (amp_18 * np.sin(2 * np.pi * 1000 * t9)).astype(np.float32)
    p9 = TMP_DIR / "09_highres_18lufs_96k_32bit.wav"
    sf.write(str(p9), np.column_stack((tone_96k, tone_96k)), sr9, subtype='PCM_32')
    fixtures["09_highres_18lufs_96k_32bit.wav"] = p9

    # 10. Short File (< 3.0s, LRA N/A, 48kHz, 24-bit Stereo, 1.5s)
    sr10, dur10 = 48000, 1.5
    t10 = np.linspace(0, dur10, int(sr10 * dur10), endpoint=False)
    tone_short = (0.2 * np.sin(2 * np.pi * 440 * t10)).astype(np.float32)
    p10 = TMP_DIR / "10_short_file_1.5s_48k.wav"
    sf.write(str(p10), np.column_stack((tone_short, tone_short)), sr10, subtype='PCM_24')
    fixtures["10_short_file_1.5s_48k.wav"] = p10

    # 11. Large Dynamic Transitions (48kHz, 24-bit Stereo, 8.0s: loud -> quiet -> loud)
    sr11, dur11 = 48000, 8.0
    t11 = np.linspace(0, dur11, int(sr11 * dur11), endpoint=False)
    dyn_wave = np.zeros_like(t11)
    dyn_wave[(t11 >= 0) & (t11 < 3.0)] = 0.5 * np.sin(2 * np.pi * 440 * t11[(t11 >= 0) & (t11 < 3.0)]) # -9 LUFS
    dyn_wave[(t11 >= 3.0) & (t11 < 5.5)] = 0.05 * np.sin(2 * np.pi * 440 * t11[(t11 >= 3.0) & (t11 < 5.5)]) # -29 LUFS
    dyn_wave[(t11 >= 5.5)] = 0.4 * np.sin(2 * np.pi * 440 * t11[(t11 >= 5.5)]) # -11 LUFS
    p11 = TMP_DIR / "11_dynamic_transitions_8s_48k.wav"
    sf.write(str(p11), np.column_stack((dyn_wave, dyn_wave)).astype(np.float32), sr11, subtype='PCM_24')
    fixtures["11_dynamic_transitions_8s_48k.wav"] = p11

    # 12. Audio with Silence Gaps between Loud Sections (44.1kHz 16-bit Stereo, 7.0s)
    sr12, dur12 = 44100, 7.0
    t12 = np.linspace(0, dur12, int(sr12 * dur12), endpoint=False)
    gap_wave = np.zeros_like(t12)
    gap_wave[(t12 >= 0.5) & (t12 < 3.0)] = 0.3 * np.sin(2 * np.pi * 1000 * t12[(t12 >= 0.5) & (t12 < 3.0)])
    gap_wave[(t12 >= 4.5) & (t12 < 6.5)] = 0.35 * np.sin(2 * np.pi * 1000 * t12[(t12 >= 4.5) & (t12 < 6.5)])
    p12 = TMP_DIR / "12_silence_gaps_7s_44k.wav"
    sf.write(str(p12), np.column_stack((gap_wave, gap_wave)).astype(np.float32), sr12, subtype='PCM_16')
    fixtures["12_silence_gaps_7s_44k.wav"] = p12

    return fixtures

def run_python_analysis(file_path: Path):
    info = extract_file_info(file_path)
    data, sr = load_audio_file(file_path)
    
    loudness = calculate_loudness(data, sr)
    sample_peak_linear, sample_peak_dbfs = calculate_sample_peak(data)
    true_peak_linear, true_peak_dbtp = calculate_true_peak(data, sr)
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
        "integrated_lufs": round(loudness.integrated_lufs, 2),
        "short_term_max_lufs": round(loudness.short_term_max_lufs, 2) if loudness.short_term_max_lufs is not None else None,
        "loudness_range_lu": round(loudness.loudness_range_lu, 1) if loudness.loudness_range_lu is not None else None,
        "sample_peak_linear": round(sample_peak_linear, 5),
        "sample_peak_dbfs": round(sample_peak_dbfs, 2),
        "true_peak_linear": round(true_peak_linear, 5),
        "true_peak_dbtp": round(true_peak_dbtp, 2),
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
      integrated_lufs: res.integratedLufs,
      momentary_max_lufs: res.momentaryMaxLufs,
      short_term_max_lufs: res.shortTermMaxLufs,
      loudness_range_lu: res.loudnessRangeLu,
      sample_peak_linear: res.samplePeakLinear,
      sample_peak_dbfs: res.samplePeakDbfs,
      true_peak_linear: res.truePeakLinear,
      true_peak_dbtp: res.truePeakDbtp,
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
    print("==========================================================================================")
    print(" 🔬 SONICHECKS PARITY VERIFICATION (PHASE 3.1): LRA & SHORT-TERM BENCHMARK")
    print("==========================================================================================\n")
    
    fixtures = generate_fixtures()
    ts_results = run_browser_analysis_via_node(fixtures)
    
    all_passed = True
    total_metrics_tested = 0
    passed_metrics = 0

    for filename in sorted(fixtures.keys()):
        filepath = fixtures[filename]
        print(f"▶ Inspecting Fixture: {filename}")
        py = run_python_analysis(filepath)
        ts = ts_results.get(filename)
        
        if not ts:
            print(f"  ❌ Missing TS result for {filename}")
            all_passed = False
            continue

        metrics = [
            ("Integrated LUFS", "integrated_lufs", 0.05),
            ("Loudness Range (LRA)", "loudness_range_lu", 0.15),
            ("Short-Term Max LUFS", "short_term_max_lufs", 0.05),
            ("True Peak (dBTP)", "true_peak_dbtp", 0.15),
            ("Sample Peak (dBFS)", "sample_peak_dbfs", 0.05),
            ("RMS (dBFS)", "rms_dbfs", 0.05),
            ("Duration (sec)", "duration_seconds", 0.01),
            ("Sample Rate (Hz)", "sample_rate", "exact"),
            ("Bit Depth", "bit_depth", "exact"),
            ("Channels", "channels", "exact")
        ]

        print(f"  {'Metric':<22} | {'Python Reference':<18} | {'Browser Engine':<18} | {'Diff':<10} | {'Status'}")
        print(f"  {'-'*22}-+-{'-'*18}-+-{'-'*18}-+-{'-'*10}-+-{'-'*10}")

        for label, key, tol in metrics:
            val_py = py.get(key)
            val_ts = ts.get(key)
            total_metrics_tested += 1
            
            status = "✅ PASS"
            diff_str = "0.000"
            if tol == "exact":
                if val_py != val_ts:
                    status = f"❌ MISMATCH"
                    all_passed = False
                else:
                    passed_metrics += 1
            else:
                if val_py is None and val_ts is None:
                    diff_str = "N/A"
                    passed_metrics += 1
                elif val_py is None or val_ts is None:
                    status = "❌ NONE_MISMATCH"
                    all_passed = False
                else:
                    diff = abs(float(val_py) - float(val_ts))
                    diff_str = f"{diff:.3f}"
                    if diff > tol:
                        status = f"❌ > {tol}"
                        all_passed = False
                    else:
                        passed_metrics += 1

            print(f"  {label:<22} | {str(val_py):<18} | {str(val_ts):<18} | {diff_str:<10} | {status}")
        print()

    print("==========================================================================================")
    print(f" 📊 BENCHMARK SUMMARY: {passed_metrics} / {total_metrics_tested} METRICS PASSED ({passed_metrics/total_metrics_tested*100:.1f}%)")
    print("==========================================================================================")
    if all_passed:
        print("🎉 100% SUCCESS: BROSER LRA AND SHORT-TERM LUFS MATCH PYTHON REFERENCE!")
    else:
        print("❌ Some parity discrepancies were found. Please inspect the log above.")

if __name__ == "__main__":
    main()
