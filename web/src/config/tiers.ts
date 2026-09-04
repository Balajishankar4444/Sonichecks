export type ProductTier = 'FREE' | 'PRO' | 'STUDIO';

export interface TierFeatures {
  id: ProductTier;
  name: string;
  priceEur: number;
  monthlyFileLimit: number;
  maxBatchSize: number;
  // Core Analysis (All tiers)
  singleFileQC: boolean;
  passWarningFail: boolean;
  lufsLoudness: boolean;
  truePeak: boolean;
  clippingDetection: boolean;
  silenceDetection: boolean;
  sampleRateCheck: boolean;
  bitDepthCheck: boolean;
  channelCheck: boolean;
  fileContainerValidation: boolean;
  basicDeliveryProfiles: boolean;
  // Pro / Studio Capabilities
  fullDeliveryLibrary: boolean;
  deliveryProfileFinder: 'Basic' | 'Full';
  whyDidItFail: 'Basic' | 'Detailed';
  howToFixIt: 'Basic' | 'Detailed';
  findingTimestamps: boolean;
  waveformEvidence: boolean;
  listenAroundFinding: boolean;
  batchQC: boolean;
  qcComparisonMatrix: boolean;
  customProfiles: 'None' | 'Standard' | 'Unlimited';
  savedHistory: boolean;
  historyComparison: 'None' | 'Standard' | 'Advanced';
  pdfCertificate: boolean;
  bulkPdfCertificates: 'None' | 'Limited' | 'Full';
  csvExport: boolean;
  batchCsvExport: boolean;
  sha256FileHash: boolean;
  profileVersioning: boolean;
  projects: 'None' | 'Basic' | 'Advanced';
  // Studio Exclusive
  multiTrackOrganization: boolean;
  clientProjectOrganization: boolean;
  jsonExport: boolean;
  batchSummaryReport: boolean;
  largeProjectWorkflows: boolean;
  priorityProcessing: boolean;
  // Metadata
  description: string;
  badge?: string;
  ctaText: string;
}

export const TIER_CONFIGS: Record<ProductTier, TierFeatures> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    priceEur: 0,
    monthlyFileLimit: 5,
    maxBatchSize: 1,
    singleFileQC: true,
    passWarningFail: true,
    lufsLoudness: true,
    truePeak: true,
    clippingDetection: true,
    silenceDetection: true,
    sampleRateCheck: true,
    bitDepthCheck: true,
    channelCheck: true,
    fileContainerValidation: true,
    basicDeliveryProfiles: true,
    fullDeliveryLibrary: false,
    deliveryProfileFinder: 'Basic',
    whyDidItFail: 'Basic',
    howToFixIt: 'Basic',
    findingTimestamps: false,
    waveformEvidence: false,
    listenAroundFinding: false,
    batchQC: false,
    qcComparisonMatrix: false,
    customProfiles: 'None',
    savedHistory: false,
    historyComparison: 'None',
    pdfCertificate: false,
    bulkPdfCertificates: 'None',
    csvExport: false,
    batchCsvExport: false,
    sha256FileHash: false,
    profileVersioning: false,
    projects: 'None',
    multiTrackOrganization: false,
    clientProjectOrganization: false,
    jsonExport: false,
    batchSummaryReport: false,
    largeProjectWorkflows: false,
    priorityProcessing: false,
    description: 'For trying Sonichecks with genuine single-file QC.',
    ctaText: 'Start Free'
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    priceEur: 4.99,
    monthlyFileLimit: 100,
    maxBatchSize: 50,
    singleFileQC: true,
    passWarningFail: true,
    lufsLoudness: true,
    truePeak: true,
    clippingDetection: true,
    silenceDetection: true,
    sampleRateCheck: true,
    bitDepthCheck: true,
    channelCheck: true,
    fileContainerValidation: true,
    basicDeliveryProfiles: true,
    fullDeliveryLibrary: true,
    deliveryProfileFinder: 'Full',
    whyDidItFail: 'Detailed',
    howToFixIt: 'Detailed',
    findingTimestamps: true,
    waveformEvidence: true,
    listenAroundFinding: true,
    batchQC: true,
    qcComparisonMatrix: true,
    customProfiles: 'Standard',
    savedHistory: true,
    historyComparison: 'Standard',
    pdfCertificate: true,
    bulkPdfCertificates: 'Limited',
    csvExport: true,
    batchCsvExport: true,
    sha256FileHash: true,
    profileVersioning: true,
    projects: 'Basic',
    multiTrackOrganization: false,
    clientProjectOrganization: false,
    jsonExport: false,
    batchSummaryReport: false,
    largeProjectWorkflows: false,
    priorityProcessing: false,
    description: 'For independent audio professionals needing batch QC, waveform evidence, and certificates.',
    badge: 'Recommended',
    ctaText: 'Choose Pro'
  },
  STUDIO: {
    id: 'STUDIO',
    name: 'Studio',
    priceEur: 14.99,
    monthlyFileLimit: Infinity,
    maxBatchSize: 200,
    singleFileQC: true,
    passWarningFail: true,
    lufsLoudness: true,
    truePeak: true,
    clippingDetection: true,
    silenceDetection: true,
    sampleRateCheck: true,
    bitDepthCheck: true,
    channelCheck: true,
    fileContainerValidation: true,
    basicDeliveryProfiles: true,
    fullDeliveryLibrary: true,
    deliveryProfileFinder: 'Full',
    whyDidItFail: 'Detailed',
    howToFixIt: 'Detailed',
    findingTimestamps: true,
    waveformEvidence: true,
    listenAroundFinding: true,
    batchQC: true,
    qcComparisonMatrix: true,
    customProfiles: 'Unlimited',
    savedHistory: true,
    historyComparison: 'Advanced',
    pdfCertificate: true,
    bulkPdfCertificates: 'Full',
    csvExport: true,
    batchCsvExport: true,
    sha256FileHash: true,
    profileVersioning: true,
    projects: 'Advanced',
    multiTrackOrganization: true,
    clientProjectOrganization: true,
    jsonExport: true,
    batchSummaryReport: true,
    largeProjectWorkflows: true,
    priorityProcessing: true,
    description: 'For commercial studios, audio directors, and label workflows with multi-track projects.',
    ctaText: 'Choose Studio'
  }
};

export interface FeatureMatrixRow {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
  category: 'Volume' | 'Core Analysis' | 'Profiles & Intelligence' | 'Evidence & Audition' | 'Batch & Matrix' | 'History & Export' | 'Projects & Organization';
  description?: string;
}

export const FEATURE_MATRIX_ROWS: FeatureMatrixRow[] = [
  { 
    name: 'Monthly files', 
    free: '5', 
    pro: '100', 
    studio: 'Unlimited', 
    category: 'Volume',
    description: 'Total number of full audio file QC inspections included per monthly billing cycle.'
  },
  { 
    name: 'Single-file QC', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'Instant on-device deterministic audio signal analysis using browser DSP.'
  },
  { 
    name: 'PASS / WARNING / FAIL', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'Deterministic traffic-light status evaluation against target delivery standards.'
  },
  { 
    name: 'LUFS / Loudness', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'ITU-R BS.1770-4 Integrated Loudness (LUFS), Short-term, Momentary & EBU LRA.'
  },
  { 
    name: 'True Peak', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: '4x polyphase inter-sample peak over-detection in dBTP.'
  },
  { 
    name: 'Clipping detection', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'Digital 0 dBFS sample consecutive flatline and inter-sample overshoot detection.'
  },
  { 
    name: 'Silence detection', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'Head/lead-in silence, tail lead-out silence, and internal dropout gating.'
  },
  { 
    name: 'Sample rate check', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'Validation against broadcast and delivery standards (44.1, 48, 96 kHz).'
  },
  { 
    name: 'Bit depth check', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: '16-bit, 24-bit, and 32-bit float container and PCM precision inspection.'
  },
  { 
    name: 'Channel check', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'Mono, stereo, and multi-channel interleaved channel configuration.'
  },
  { 
    name: 'File/container validation', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Core Analysis',
    description: 'Binary header integrity verification for WAV, MP3, FLAC, and AIFF.'
  },
  { 
    name: 'Basic delivery profiles', 
    free: true, 
    pro: true, 
    studio: true, 
    category: 'Profiles & Intelligence',
    description: 'Standard Master (-14 LUFS / -1.0 dBTP) & Basic Spotify profile.'
  },
  { 
    name: 'Full delivery library', 
    free: '❌ (Locked)', 
    pro: true, 
    studio: true, 
    category: 'Profiles & Intelligence',
    description: '11+ verified target standards (Apple Music, YouTube, Broadcast EBU R128, ACX Audiobook, AES TD1004, TIDAL, Amazon Music).'
  },
  { 
    name: 'Delivery Profile Finder', 
    free: 'Basic', 
    pro: true, 
    studio: true, 
    category: 'Profiles & Intelligence',
    description: 'Interactive smart destination selector matching delivery destination constraints.'
  },
  { 
    name: 'Why did it fail?', 
    free: 'Basic', 
    pro: 'Detailed', 
    studio: 'Detailed', 
    category: 'Profiles & Intelligence',
    description: 'In-depth engineering explanation detailing exactly why DSP metrics deviated from standard specifications.'
  },
  { 
    name: 'How to fix it', 
    free: 'Basic', 
    pro: 'Detailed', 
    studio: 'Detailed', 
    category: 'Profiles & Intelligence',
    description: 'Step-by-step DAW action items (exact limiter ceiling adjustment, gain trim dB, and dither settings).'
  },
  { 
    name: 'Finding timestamps', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'Evidence & Audition',
    description: 'Millisecond-accurate timecodes for clipping events, True Peak spikes, and silence breaches.'
  },
  { 
    name: 'Waveform evidence', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'Evidence & Audition',
    description: 'Interactive waveform visualizer highlighting exact finding markers directly over audio envelope.'
  },
  { 
    name: 'Listen around finding', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'Evidence & Audition',
    description: 'One-click on-device WebAudio pre-roll and post-roll playback around any detected defect.'
  },
  { 
    name: 'Batch QC', 
    free: '❌ (Pro)', 
    pro: 'Up to 50', 
    studio: 'Up to 200', 
    category: 'Batch & Matrix',
    description: 'Concurrent multi-track ingestion, parallel analysis queue, and album-wide evaluation.'
  },
  { 
    name: 'QC comparison matrix', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'Batch & Matrix',
    description: 'Interactive side-by-side album matrix with live sorting, search, and pass/fail filtering.'
  },
  { 
    name: 'Custom QC profiles', 
    free: '❌ (Pro)', 
    pro: '✅ (Standard)', 
    studio: 'Unlimited', 
    category: 'Profiles & Intelligence',
    description: 'Create, edit, import, and export custom target specs (stored locally in browser cache — export to backup if switching devices or systems).'
  },
  { 
    name: 'Saved QC history', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'History & Export',
    description: 'Audit log of previous QC runs with search and re-inspection (stored locally on device cache — not on cloud).'
  },
  { 
    name: 'QC history comparison', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: 'Advanced', 
    category: 'History & Export',
    description: 'Compare revision tracks against previous QC passes to verify fixes between mix versions.'
  },
  { 
    name: 'PDF QC certificate', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'History & Export',
    description: 'Cryptographic delivery pass certificate for labels, streaming distributors, and audio directors.'
  },
  { 
    name: 'Bulk PDF certificates', 
    free: '❌ (Pro)', 
    pro: 'Limited', 
    studio: 'Full', 
    category: 'History & Export',
    description: 'One-click multi-track batch PDF certificate export combining all tracks into a client deliverable.'
  },
  { 
    name: 'CSV export', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'History & Export',
    description: 'Download individual track metrics formatted as standard spreadsheet CSV data.'
  },
  { 
    name: 'Batch CSV export', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'History & Export',
    description: 'Export multi-track metrics into a unified spreadsheet for project managers and mastering engineers.'
  },
  { 
    name: 'SHA-256 file hash', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'History & Export',
    description: 'Cryptographic hash generated on-device to certify file authenticity and prevent accidental master mixups.'
  },
  { 
    name: 'Profile versioning', 
    free: '❌ (Pro)', 
    pro: true, 
    studio: true, 
    category: 'Profiles & Intelligence',
    description: 'Version-controlled custom profiles (e.g. v1.0, v2.1) ensuring standard consistency across engineering teams.'
  },
  { 
    name: 'Projects', 
    free: '❌ (Pro)', 
    pro: 'Basic', 
    studio: 'Advanced', 
    category: 'Projects & Organization',
    description: 'Organize files by album, client release, EP, or game audio package with version tracking.'
  },
  { 
    name: 'Multi-track project organization', 
    free: '❌', 
    pro: '❌', 
    studio: true, 
    category: 'Projects & Organization',
    description: 'Hierarchical multi-stem and multi-track album grouping with unified release readiness status.'
  },
  { 
    name: 'Client/project organization', 
    free: '❌', 
    pro: '❌', 
    studio: true, 
    category: 'Projects & Organization',
    description: 'Dedicated client workspaces with custom default delivery profiles and branded exports.'
  },
  { 
    name: 'JSON export', 
    free: '❌', 
    pro: '❌', 
    studio: true, 
    category: 'History & Export',
    description: 'Structured JSON data payload for automated mastering pipelines, QA scripts, and enterprise CI/CD.'
  },
  { 
    name: 'Batch summary report', 
    free: '❌', 
    pro: '❌', 
    studio: true, 
    category: 'Batch & Matrix',
    description: 'High-level studio health report with statistical distribution of LUFS, Peak, and defect density across 200+ tracks.'
  },
  { 
    name: 'Large project workflows', 
    free: '❌', 
    pro: '❌', 
    studio: true, 
    category: 'Projects & Organization',
    description: 'High-capacity queue architecture designed for soundtrack packaging and game audio asset validation.'
  }
];

export function getTierConfig(tierStr?: string): TierFeatures {
  if (!tierStr) return TIER_CONFIGS.FREE;
  const upper = tierStr.toUpperCase() as ProductTier;
  return TIER_CONFIGS[upper] || TIER_CONFIGS.FREE;
}

