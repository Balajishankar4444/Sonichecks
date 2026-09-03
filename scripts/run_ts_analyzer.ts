
import fs from 'fs';
import path from 'path';
import { analyzeWavBuffer } from '../web/src/lib/audio-engine/analyzer';

async function main() {
  const results: Record<string, any> = {};
  const fixtureDir = "C:\\Users\\balaji\\sonichecks\\tmp_parity_fixtures";
  const files = fs.readdirSync(fixtureDir).filter(f => f.endsWith('.wav'));
  
  for (const file of files) {
    const filePath = path.join(fixtureDir, file);
    const buffer = fs.readFileSync(filePath).buffer;
    const res = await analyzeWavBuffer(buffer, file);
    results[file] = {
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
    };
  }
  console.log('---JSON_START---' + JSON.stringify(results) + '---JSON_END---');
}

main().catch(console.error);
