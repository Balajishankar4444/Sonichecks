import { WavMetadata } from './types';

export interface ParsedWavData {
  metadata: WavMetadata;
  channels: Float32Array[]; // One Float32Array per channel, normalized to [-1.0, 1.0]
}

function getChannelLayoutName(channels: number): string {
  if (channels === 1) return 'Mono';
  if (channels === 2) return 'Stereo';
  if (channels === 6) return '5.1 Surround';
  if (channels === 8) return '7.1 Surround';
  return `${channels} Channels`;
}

function readString(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str;
}

export function parseWavHeader(buffer: ArrayBuffer): WavMetadata {
  if (buffer.byteLength < 44) {
    throw new Error('Invalid WAV file: File is too small to contain a valid RIFF header.');
  }

  const view = new DataView(buffer);

  // 1. Check RIFF header
  const riffHeader = readString(view, 0, 4);
  if (riffHeader !== 'RIFF') {
    throw new Error(`Invalid WAV file: Expected 'RIFF' container, found '${riffHeader}'.`);
  }

  // 2. Check WAVE format
  const waveFormat = readString(view, 8, 4);
  if (waveFormat !== 'WAVE') {
    throw new Error(`Invalid WAV file: Expected 'WAVE' format, found '${waveFormat}'.`);
  }

  let offset = 12;
  let fmtChunkFound = false;
  let dataChunkFound = false;

  let audioFormat = 1;
  let channels = 2;
  let sampleRate = 44100;
  let byteRate = 0;
  let blockAlign = 0;
  let bitDepth = 16;
  let dataChunkOffset = 0;
  let dataChunkSize = 0;

  // Iterate over subchunks
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = readString(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      fmtChunkFound = true;
      audioFormat = view.getUint16(offset + 8, true);
      channels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      byteRate = view.getUint32(offset + 16, true);
      blockAlign = view.getUint16(offset + 20, true);
      bitDepth = view.getUint16(offset + 22, true);

      // Handle Extensible format (0xFFFE) where real sub-format is in GUID
      if (audioFormat === 0xfffe && chunkSize >= 40) {
        audioFormat = view.getUint16(offset + 24 + 6, true); // Extract subFormat from GUID
      }
    } else if (chunkId === 'data') {
      dataChunkFound = true;
      dataChunkOffset = offset + 8;
      dataChunkSize = Math.min(chunkSize, buffer.byteLength - dataChunkOffset);
      break; // Found data payload
    }

    // Skip chunk payload (accounting for 2-byte word alignment)
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  if (!fmtChunkFound) {
    throw new Error('Invalid WAV file: Missing required \'fmt \' chunk in header.');
  }

  if (!dataChunkFound || dataChunkOffset === 0) {
    throw new Error('Invalid WAV file: Missing \'data\' audio payload chunk.');
  }

  if (audioFormat !== 1 && audioFormat !== 3) {
    throw new Error(`Unsupported WAV audio format (${audioFormat}). Only PCM (1) and IEEE Float (3) are supported.`);
  }

  if (![8, 16, 24, 32].includes(bitDepth)) {
    throw new Error(`Unsupported PCM bit depth: ${bitDepth}-bit. Supported bit depths: 16-bit, 24-bit, 32-bit.`);
  }

  const bytesPerSample = bitDepth / 8;
  const numSamples = Math.floor(dataChunkSize / (channels * bytesPerSample));
  const durationSeconds = numSamples / sampleRate;

  return {
    format: 'WAV',
    audioFormat,
    audioFormatName: audioFormat === 1 ? 'PCM' : 'IEEE Float',
    channels,
    channelLayout: getChannelLayoutName(channels),
    sampleRate,
    bitDepth,
    byteRate,
    blockAlign,
    dataChunkOffset,
    dataChunkSize,
    numSamples,
    durationSeconds: Math.round(durationSeconds * 1000) / 1000,
    fileSizeBytes: buffer.byteLength
  };
}

export function parseWavAudioData(buffer: ArrayBuffer): ParsedWavData {
  const metadata = parseWavHeader(buffer);
  const { channels: numChannels, numSamples, bitDepth, audioFormat, dataChunkOffset, dataChunkSize } = metadata;

  const view = new DataView(buffer, dataChunkOffset, dataChunkSize);

  // Allocate channel buffers
  const channelBuffers: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelBuffers.push(new Float32Array(numSamples));
  }

  let byteIndex = 0;

  if (audioFormat === 3) {
    // 32-bit IEEE Floating point
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        if (byteIndex + 4 <= dataChunkSize) {
          channelBuffers[ch][i] = view.getFloat32(byteIndex, true);
          byteIndex += 4;
        }
      }
    }
  } else if (bitDepth === 16) {
    // 16-bit Signed PCM Integer (-32768 to 32767)
    const scale = 1.0 / 32768.0;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        if (byteIndex + 2 <= dataChunkSize) {
          const sample = view.getInt16(byteIndex, true);
          channelBuffers[ch][i] = sample * scale;
          byteIndex += 2;
        }
      }
    }
  } else if (bitDepth === 24) {
    // 24-bit Signed PCM Integer (-8388608 to 8388607)
    const scale = 1.0 / 8388608.0;
    const uint8 = new Uint8Array(buffer, dataChunkOffset, dataChunkSize);
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        if (byteIndex + 3 <= dataChunkSize) {
          const b0 = uint8[byteIndex];
          const b1 = uint8[byteIndex + 1];
          const b2 = uint8[byteIndex + 2];
          // Sign extend 24-bit to 32-bit signed int
          const raw = (b0 | (b1 << 8) | (b2 << 16)) << 8 >> 8;
          channelBuffers[ch][i] = raw * scale;
          byteIndex += 3;
        }
      }
    }
  } else if (bitDepth === 32) {
    // 32-bit Signed PCM Integer
    const scale = 1.0 / 2147483648.0;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        if (byteIndex + 4 <= dataChunkSize) {
          const sample = view.getInt32(byteIndex, true);
          channelBuffers[ch][i] = sample * scale;
          byteIndex += 4;
        }
      }
    }
  } else if (bitDepth === 8) {
    // 8-bit Unsigned PCM (0 to 255, 128 = silence)
    const uint8 = new Uint8Array(buffer, dataChunkOffset, dataChunkSize);
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        if (byteIndex < dataChunkSize) {
          channelBuffers[ch][i] = (uint8[byteIndex] - 128) / 128.0;
          byteIndex += 1;
        }
      }
    }
  }

  return {
    metadata,
    channels: channelBuffers
  };
}
