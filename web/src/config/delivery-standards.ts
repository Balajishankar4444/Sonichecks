import { QCProfile } from '@/types/qc';

export const VERIFIED_DELIVERY_PROFILES: QCProfile[] = [
  {
    profile_id: 'standard',
    name: 'Standard Digital Master',
    platform: 'Universal Distribution',
    category: 'Music',
    version: '2.0',
    description: 'Universal commercial mastering standard for multi-platform distribution and direct client delivery.',
    source_reference: 'AES Recommended Practice for Digital Audio Distribution',
    last_verified_date: '2026-08-15',
    rules: {
      allowed_sample_rates: [44100, 48000, 88200, 96000, 192000],
      allowed_bit_depths: [16, 24, 32],
      min_lufs: -18.0,
      max_lufs: -12.0,
      max_true_peak_dbtp: -1.0,
      allow_clipping: false,
      min_leading_silence_sec: 0.05,
      max_leading_silence_sec: 2.0,
      min_trailing_silence_sec: 0.2,
      max_trailing_silence_sec: 5.0
    }
  },
  {
    profile_id: 'spotify',
    name: 'Spotify Streaming',
    platform: 'Spotify',
    category: 'Music',
    version: '2.1',
    description: 'Optimized for Spotify loudness normalization (-14 LUFS target) and lossy Ogg Vorbis/AAC codec transcoding headroom.',
    source_reference: 'Spotify for Artists Mastering Guide (2025/2026)',
    last_verified_date: '2026-07-20',
    rules: {
      allowed_sample_rates: [44100, 48000],
      allowed_bit_depths: [16, 24],
      min_lufs: -15.0,
      max_lufs: -13.0,
      max_true_peak_dbtp: -1.0,
      allow_clipping: false,
      min_leading_silence_sec: 0.05,
      max_leading_silence_sec: 1.5,
      min_trailing_silence_sec: 0.2,
      max_trailing_silence_sec: 4.0
    }
  },
  {
    profile_id: 'apple_music',
    name: 'Apple Music / Sound Check',
    platform: 'Apple Music',
    category: 'Music',
    version: '2.2',
    description: 'Apple Digital Masters specification with Sound Check normalization target (-16 LUFS) and strict True Peak headroom.',
    source_reference: 'Apple Digital Masters Technology Brief',
    last_verified_date: '2026-06-10',
    rules: {
      allowed_sample_rates: [44100, 48000, 88200, 96000],
      allowed_bit_depths: [24],
      min_lufs: -17.0,
      max_lufs: -15.0,
      max_true_peak_dbtp: -1.0,
      allow_clipping: false,
      min_leading_silence_sec: 0.05,
      max_leading_silence_sec: 1.5,
      min_trailing_silence_sec: 0.2,
      max_trailing_silence_sec: 4.0
    }
  },
  {
    profile_id: 'youtube',
    name: 'YouTube Video / Music',
    platform: 'YouTube',
    category: 'YouTube / Video',
    version: '1.2',
    description: 'YouTube automated loudness normalization threshold (-14 LUFS) and 48 kHz video container audio specification.',
    source_reference: 'YouTube Video Upload Audio Guidelines',
    last_verified_date: '2026-05-14',
    rules: {
      allowed_sample_rates: [48000],
      allowed_bit_depths: [16, 24],
      min_lufs: -15.0,
      max_lufs: -13.0,
      max_true_peak_dbtp: -1.0,
      allow_clipping: false
    }
  },
  {
    profile_id: 'podcast_aes',
    name: 'Podcast Delivery (AES TD1004)',
    platform: 'Apple Podcasts / Spotify / RSS',
    category: 'Podcast',
    version: '1.0',
    description: 'AES recommendation for spoken-word audio podcast distribution (-16 LUFS stereo, -19 LUFS mono, -1.0 dBTP ceiling).',
    source_reference: 'AES TD1004.1.15-10: Recommendation for Loudness of Internet Audio',
    last_verified_date: '2026-04-02',
    rules: {
      allowed_sample_rates: [44100, 48000],
      allowed_bit_depths: [16, 24],
      min_lufs: -17.0,
      max_lufs: -15.0,
      max_true_peak_dbtp: -1.0,
      allow_clipping: false,
      min_leading_silence_sec: 0.1,
      max_leading_silence_sec: 1.0,
      min_trailing_silence_sec: 0.5,
      max_trailing_silence_sec: 3.0
    }
  },
  {
    profile_id: 'acx_audiobook',
    name: 'Audiobook (ACX / Audible)',
    platform: 'Audible / ACX',
    category: 'Audiobook',
    version: '2.0',
    description: 'Strict ACX delivery specifications: -23 to -18 LUFS, True Peak ≤ -3.0 dBTP, 44.1 kHz 16-bit, precise head/tail room tone.',
    source_reference: 'ACX Audio Submission Requirements & Quality Assurance',
    last_verified_date: '2026-08-01',
    rules: {
      allowed_sample_rates: [44100],
      allowed_bit_depths: [16],
      min_lufs: -23.0,
      max_lufs: -18.0,
      max_true_peak_dbtp: -3.0,
      allow_clipping: false,
      min_leading_silence_sec: 0.5,
      max_leading_silence_sec: 1.0,
      min_trailing_silence_sec: 1.0,
      max_trailing_silence_sec: 5.0
    }
  },
  {
    profile_id: 'broadcast_ebu',
    name: 'European Broadcast (EBU R128)',
    platform: 'European Television & Radio',
    category: 'Broadcast',
    version: '3.0',
    description: 'Strict European broadcast compliance (-23.0 LUFS ±0.5 LU, -1.0 dBTP True Peak ceiling, 48 kHz / 24-bit PCM).',
    source_reference: 'EBU R128 / EBU Tech 3341 / EBU Tech 3342',
    last_verified_date: '2026-08-10',
    rules: {
      allowed_sample_rates: [48000],
      allowed_bit_depths: [24],
      min_lufs: -23.5,
      max_lufs: -22.5,
      max_true_peak_dbtp: -1.0,
      max_momentary_lufs: -15.0,
      max_short_term_lufs: -18.0,
      allow_clipping: false
    }
  },
  {
    profile_id: 'broadcast_atsc',
    name: 'US Television Broadcast (ATSC A/85)',
    platform: 'US Broadcast & Cable',
    category: 'Broadcast',
    version: '2.0',
    description: 'FCC Commercial Advertisement Loudness Mitigation (CALM) Act compliance (-24.0 LUFS ±1.0, -2.0 dBTP True Peak ceiling).',
    source_reference: 'ATSC Recommended Practice A/85',
    last_verified_date: '2026-06-25',
    rules: {
      allowed_sample_rates: [48000],
      allowed_bit_depths: [24],
      min_lufs: -25.0,
      max_lufs: -23.0,
      max_true_peak_dbtp: -2.0,
      allow_clipping: false
    }
  },
  {
    profile_id: 'voiceover_commercial',
    name: 'Commercial Voiceover',
    platform: 'Voiceover Agencies & Radio',
    category: 'Voiceover',
    version: '1.1',
    description: 'Broadcast voiceover and narration delivery (-18 to -16 LUFS, clean room tone, zero digital overs).',
    source_reference: 'Voiceover Production & Engineering Guidelines',
    last_verified_date: '2026-05-30',
    rules: {
      allowed_sample_rates: [44100, 48000],
      allowed_bit_depths: [24],
      min_lufs: -19.0,
      max_lufs: -15.0,
      max_true_peak_dbtp: -1.0,
      allow_clipping: false,
      min_leading_silence_sec: 0.1,
      max_leading_silence_sec: 0.8,
      min_trailing_silence_sec: 0.2,
      max_trailing_silence_sec: 1.5
    }
  },
  {
    profile_id: 'club_loud',
    name: 'Club / DJ Master',
    platform: 'Club Sound Systems & Beatport',
    category: 'Club / DJ',
    version: '1.0',
    description: 'High-density electronic music master for club sound system playback (-9 to -6 LUFS, controlled true peak).',
    source_reference: 'EDM Mastering & DJ Audio Specifications',
    last_verified_date: '2026-07-15',
    rules: {
      allowed_sample_rates: [44100, 48000],
      allowed_bit_depths: [16, 24, 32],
      min_lufs: -9.0,
      max_lufs: -5.5,
      max_true_peak_dbtp: -0.2,
      allow_clipping: false
    }
  },
  {
    profile_id: 'film_theatrical',
    name: 'Film / Theatrical Dialogue',
    platform: 'Theatrical & OTT Screening',
    category: 'Film / TV',
    version: '1.0',
    description: 'Wide dynamic range theatrical feature and streaming video deliverable (-27.0 LUFS dialogue reference).',
    source_reference: 'Cinema Audio Society & SMPTE 200M',
    last_verified_date: '2026-04-18',
    rules: {
      allowed_sample_rates: [48000, 96000],
      allowed_bit_depths: [24],
      min_lufs: -28.0,
      max_lufs: -26.0,
      max_true_peak_dbtp: -2.0,
      allow_clipping: false
    }
  }
];

export const PROFILE_CATEGORIES = [
  'All',
  'Music',
  'Podcast',
  'Audiobook',
  'Broadcast',
  'YouTube / Video',
  'Film / TV',
  'Voiceover',
  'Club / DJ',
  'Custom'
] as const;

export type ProfileCategory = typeof PROFILE_CATEGORIES[number];

export function getProfileById(profileId: string, customProfiles: QCProfile[] = []): QCProfile {
  const custom = customProfiles.find(p => p.profile_id === profileId);
  if (custom) return custom;
  const verified = VERIFIED_DELIVERY_PROFILES.find(p => p.profile_id === profileId);
  return verified || VERIFIED_DELIVERY_PROFILES[0];
}

export function getAllProfiles(customProfiles: QCProfile[] = []): QCProfile[] {
  return [...VERIFIED_DELIVERY_PROFILES, ...customProfiles];
}

export const DELIVERY_STANDARDS = VERIFIED_DELIVERY_PROFILES;
