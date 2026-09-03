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

    # 1. Clean Sine -14 LUFS (48kHz, 24-bit Stereo)
    sr1, dur1 = 48000, 2.0
    t1 = np.linspace(0, dur1, int(sr1 * dur1), endpoint=False)
    tone1 = (0.188 * np.sin(2 * np.pi * 440 * t1)).astype(np.float32)
    st1 = np.column_stack((tone1, tone1))
    p1 = TMP_DIR / "1_clean_sine_14lufs_48k_24bit.wav"
    sf.write(str(p1), st1, sr1, subtype='PCM_24')
    fixtures["1_clean_sine_14lufs_48k_24bit.wav"] = p1

    # 2. -23 LUFS EBU R128 Tone (48kHz, 24-bit Stereo)
    # At 1kHz, K-weighting has ~0 dB gain. RMS of sine = amp / sqrt(2). 
    # LKFS = -0.691 + 10 log10(2 * (amp/sqrt(2))^2) = -0.691 + 10 log10(amp^2)
    # amp = 10^((-23 + 0.691) / 20) = ~ 0.0766
    amp_23 = 10 ** ((-23.0 + 0.691) / 20.0)
    tone_23 = (amp_23 * np.sin(2 * np.pi * 1000.0 * t1)).astype(np.float32)
    p2 = TMP_DIR / "2_broadcast_23lufs_48k_24bit.wav"
    sf.write(str(p2), np.column_stack((tone_23, tone_23)), sr1, subtype='PCM_24')
    fixtures["2_broadcast_23lufs_48k_24bit.wav"] = p2

    # 3. -9 LUFS High-Energy Master (44.1kHz, 16-bit Stereo)
    sr3, dur3 = 44100, 2.0
    t3 = np.linspace(0, dur3, int(sr3 * dur3), endpoint=False)
    amp_9 = 10 ** ((-9.0 + 0.691) / 20.0)
    tone_9 = (amp_9 * np.sin(2 * np.pi * 1000.0 * t3)).astype(np.float32)
    p3 = TMP_DIR / "3_loud_9lufs_44k_16bit.wav"
    sf.write(str(p3), np.column_stack((tone_9, tone_9)), sr3, subtype='PCM_16')
    fixtures["3_loud_9lufs_44k_16bit.wav"] = p3

    # 4. -30 LUFS Low-Level Signal (44.1kHz, 16-bit Mono)
    amp_30 = 10 ** ((-30.0 + 0.691) / 20.0)
    tone_30 = (amp_30 * np.sin(2 * np.pi * 1000.0 * t3)).astype(np.float32)
    p4 = TMP_DIR / "4_quiet_30lufs_44k_16bit_mono.wav"
    sf.write(str(p4), tone_30, sr3, subtype='PCM_16')
    fixtures["4_quiet_30lufs_44k_16bit_mono.wav"] = p4

    # 5. Dynamic Multi-tone Music Simulation (48kHz, 24-bit Stereo)
    # Combination of 100Hz, 440Hz, 1500Hz, 5000Hz with dynamic amplitude envelope
    env = 0.5 * (1.0 + np.sin(2 * np.pi * 2.0 * t1)) # 2Hz modulation
    music_left = (env * (0.15 * np.sin(2*np.pi*100*t1) + 0.12 * np.sin(2*np.pi*440*t1) + 0.08 * np.sin(2*np.pi*2500*t1))).astype(np.float32)
    music_right = (env * (0.14 * np.sin(2*np.pi*100*t1) + 0.13 * np.sin(2*np.pi*880*t1) + 0.07 * np.sin(2*np.pi*5000*t1))).astype(np.float32)
    p5 = TMP_DIR / "5_dynamic_music_48k_24bit.wav"
    sf.write(str(p5), np.column_stack((music_left, music_right)), sr1, subtype='PCM_24')
    fixtures["5_dynamic_music_48k_24bit.wav"] = p5

    # 6. Speech Simulation (44.1kHz 16-bit Mono with pauses and vocal formants)
    speech_t = np.linspace(0, 3.0, int(sr3 * 3.0), endpoint=False)
    burst1 = (0.25 * np.sin(2*np.pi*220*speech_t) + 0.15 * np.sin(2*np.pi*700*speech_t)) * ((speech_t > 0.4) & (speech_t < 1.2))
    burst2 = (0.22 * np.sin(2*np.pi*220*speech_t) + 0.18 * np.sin(2*np.pi*1200*speech_t)) * ((speech_t > 1.8) & (speech_t < 2.7))
    speech = (burst1 + burst2).astype(np.float32)
    p6 = TMP_DIR / "6_speech_simulation_44k_16bit_mono.wav"
    sf.write(str(p6), speech, sr3, subtype='PCM_16')
    fixtures["6_speech_simulation_44k_16bit_mono.wav"] = p6

    # 7. Inter-Sample Peak Test (Sample Peak != True Peak)
    # Sine wave at fs / 4 (12kHz at 48kHz sr) offset by phase pi/4:
    # Samples fall exactly at sin(pi/4), sin(3pi/4), etc. (peak = 0.7071 = -3.01 dBFS), 
    # but the continuous wave true peak is 1.0 (0.0 dBTP)! True Peak is +3.01 dB higher than sample peak!
    t_isp = np.linspace(0, 1.0, int(48000 * 1.0), endpoint=False)
    freq_isp = 48000 / 4.0 # 12000 Hz
    phase_isp = np.pi / 4.0
    isp_wave = (1.0 * np.sin(2 * np.pi * freq_isp * t_isp + phase_isp)).astype(np.float32)
    p7 = TMP_DIR / "7_intersample_peak_48k_24bit.wav"
    sf.write(str(p7), np.column_stack((isp_wave, isp_wave)), 48000, subtype='PCM_24')
    fixtures["7_intersample_peak_48k_24bit.wav"] = p7

    # 8. Clipped Audio (44.1kHz 16-bit Stereo)
    overloaded = 1.8 * np.sin(2 * np.pi * 200 * t3)
    clipped = np.clip(overloaded, -1.0, 1.0).astype(np.float32)
    p8 = TMP_DIR / "8_hard_clipped_44k_16bit.wav"
    sf.write(str(p8), np.column_stack((clipped, clipped)), sr3, subtype='PCM_16')
    fixtures["8_hard_clipped_44k_16bit.wav"] = p8

    # 9. 96kHz High-Resolution Master (96kHz, 32-bit Stereo)
    sr9, dur9 = 96000, 1.5
    t9 = np.linspace(0, dur9, int(sr9 * dur9), endpoint=False)
    amp_18 = 10 ** ((-18.0 + 0.691) / 20.0)
    tone_96k = (amp_18 * np.sin(2 * np.pi * 1000 * t9)).astype(np.float32)
    p9 = TMP_DIR / "9_highres_18lufs_96k_32bit.wav"
    sf.write(str(p9), np.column_stack((tone_96k, tone_96k)), sr9, subtype='PCM_32')
    fixtures["9_highres_18lufs_96k_32bit.wav"] = p9

    # 10. Completely Silent File
    sil = np.zeros((int(2.0 * sr3), 2), dtype=np.float32)
    p10 = TMP_DIR / "10_completely_silent.wav"
    sf.write(str(p10), sil, sr3, subtype='PCM_16')
    fixtures["10_completely_silent.wav"] = p10

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
        "momentary_max_lufs": round(loudness.momentary_max_lufs, 2) if loudness.momentary_max_lufs is not None else None,
        "short_term_max_lufs": round(loudness.short_term_max_lufs, 2) if loudness.short_term_max_lufs is not None else None,
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
      shortTermMaxLufs: res.shortTermMaxLufs,
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
    print(" 🔬 SONICHECKS PARITY VERIFICATION (PHASE 2): LUFS & TRUE PEAK DSP BENCHMARK")
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
            ("True Peak (dBTP)", "true_peak_dbtp", 0.15),
            ("Sample Peak (dBFS)", "sample_peak_dbfs", 0.05),
            ("RMS (dBFS)", "rms_dbfs", 0.05),
            ("Duration (sec)", "duration_seconds", 0.01),
            ("Sample Rate (Hz)", "sample_rate", "exact"),
            ("Bit Depth", "bit_depth", "exact"),
            ("Channels", "channels", "exact"),
            ("Digital Clipping", "clipping_detected", "exact"),
            ("Silent File Flag", "is_completely_silent", "exact")
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
                if val_py is None or val_ts is None:
                    diff = 0.0
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
        print("🎉 100% SUCCESS: BROSER LUFS AND TRUE PEAK MATCH PYTHON REFERENCE IMPLEMENTATION!")
    else:
        print("❌ Some parity discrepancies were found. Please inspect the log above.")

if __name__ == "__main__":
    main()
