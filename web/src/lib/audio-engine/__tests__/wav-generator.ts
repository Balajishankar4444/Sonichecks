/**
 * Test helper to synthesize clean PCM WAV binary buffers for automated testing.
 */
export function createSyntheticWav(options: {
  sampleRate: number;
  channels: number;
  bitDepth: 16 | 24 | 32;
  durationSeconds: number;
  generator: (timeSec: number, channel: number) => number; // returns float in [-1.0, 1.0]
}): ArrayBuffer {
  const { sampleRate, channels, bitDepth, durationSeconds, generator } = options;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const totalBufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(totalBufferSize);
  const view = new DataView(buffer);

  // 1. RIFF Chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // 2. fmt Chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // 3. data Chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 4. Samples
  let byteOffset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    for (let ch = 0; ch < channels; ch++) {
      let sample = generator(t, ch);
      // Clamp to [-1.0, 1.0]
      sample = Math.max(-1.0, Math.min(1.0, sample));

      if (bitDepth === 16) {
        const intSample = Math.round(sample * 32767);
        view.setInt16(byteOffset, intSample, true);
        byteOffset += 2;
      } else if (bitDepth === 24) {
        const intSample = Math.round(sample * 8388607);
        const b0 = intSample & 0xff;
        const b1 = (intSample >> 8) & 0xff;
        const b2 = (intSample >> 16) & 0xff;
        view.setUint8(byteOffset, b0);
        view.setUint8(byteOffset + 1, b1);
        view.setUint8(byteOffset + 2, b2);
        byteOffset += 3;
      } else if (bitDepth === 32) {
        const intSample = Math.round(sample * 2147483647);
        view.setInt32(byteOffset, intSample, true);
        byteOffset += 4;
      }
    }
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
