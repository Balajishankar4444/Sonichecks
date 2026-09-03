import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ShieldCheck, CheckCircle2, Volume2, Sliders, ArrowRight, Layers, FileAudio, Headphones, Radio, Mic, Sparkles } from 'lucide-react';

interface SeoTopic {
  title: string;
  metaTitle: string;
  metaDescription: string;
  badge: string;
  targetProfileId: string;
  targetProfileName: string;
  heroHeadline: string;
  heroSubtitle: string;
  keyPoints: { title: string; desc: string }[];
  targetTable: { platform: string; targetLufs: string; maxTruePeak: string; notes: string }[];
}

const SEO_CONTENT: Record<string, SeoTopic> = {
  'audio-quality-checker': {
    title: 'Audio Quality Checker',
    metaTitle: 'Audio Quality Checker — Check WAV, LUFS, Peak & Clipping | Sonichecks',
    metaDescription: 'Check audio files for loudness, true peak, clipping, sample rate, bit depth, silence and delivery consistency.',
    badge: 'Automated QC Utility',
    targetProfileId: 'standard',
    targetProfileName: 'Standard Delivery',
    heroHeadline: 'Professional Audio Quality Checker for Modern Deliverables',
    heroSubtitle: 'Inspect WAV, AIFF, and FLAC files before submitting to distributors, streaming services, or mastering clients.',
    keyPoints: [
      { title: 'True Peak (dBTP) Compliance', desc: 'Avoid lossy encoder clipping by adhering to the -1.0 dBTP ceiling required by Spotify and Apple Music.' },
      { title: 'ITU-R BS.1770-4 Loudness', desc: 'Verify Integrated LUFS to prevent streaming normalization volume penalties and distorted limiter artifacts.' },
      { title: 'Digital Flat-Top Clipping', desc: 'Detect consecutive hard clipped samples hitting digital ceiling in seconds.' }
    ],
    targetTable: [
      { platform: 'Spotify', targetLufs: '-14 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Normalizes louder tracks down; tracks > -14 LUFS lose perceived dynamics.' },
      { platform: 'Apple Music', targetLufs: '-16 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Sound Check enabled; preserves transient headroom on AAC transcodes.' },
      { platform: 'YouTube', targetLufs: '-14 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Applies rigid peak limiter on non-compliant audio.' },
      { platform: 'Audible / ACX', targetLufs: '-23 to -18 LUFS', maxTruePeak: '-3.0 dBTP', notes: 'Strict spoken-word audiobook requirement with head/tail noise floor checks.' }
    ]
  },
  'audio-qc': {
    title: 'Audio Quality Control',
    metaTitle: 'Audio QC — Automated Audio Inspection & Verification | Sonichecks',
    metaDescription: 'Comprehensive audio quality control: detect sample rate mismatch, bit depth discrepancies, and clipping distortion.',
    badge: 'Broadcast & Delivery QC',
    targetProfileId: 'broadcast_ebu',
    targetProfileName: 'Broadcast (EBU R128)',
    heroHeadline: 'Instant Audio QC for Music, Broadcast & Audiobooks',
    heroSubtitle: 'Eliminate delivery rejections with deterministic quality control rules and downloadable PDF certificates.',
    keyPoints: [
      { title: 'Batch Uniformity', desc: 'Automatically cross-reference tracks in an album to verify sample rates and bit depths match.' },
      { title: 'Room Tone & Silence', desc: 'Measure leading and trailing silence durations to prevent truncated transient starts.' },
      { title: 'Plain English Fixes', desc: 'Actionable guidance on exactly how many dB to adjust master limiters to achieve full compliance.' }
    ],
    targetTable: [
      { platform: 'EBU R128 Broadcast', targetLufs: '-23.0 LUFS (±0.5)', maxTruePeak: '-1.0 dBTP', notes: 'European television and broadcast delivery specification.' },
      { platform: 'AES TD1004 (Streaming)', targetLufs: '-16 to -14 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Audio Engineering Society recommendation for internet distribution.' },
      { platform: 'Club / DJ Master', targetLufs: '-9 to -6 LUFS', maxTruePeak: '-0.1 dBTP', notes: 'High-energy dance music and CDJ club playback.' }
    ]
  },
  'loudness-checker': {
    title: 'Loudness Checker',
    metaTitle: 'LUFS Loudness Checker — Measure Integrated LUFS & LRA | Sonichecks',
    metaDescription: 'Free online LUFS loudness checker. Measure integrated LUFS, short-term loudness, and loudness range accurately.',
    badge: 'LUFS & Dynamics Engine',
    targetProfileId: 'streaming',
    targetProfileName: 'Streaming (Spotify / Apple Music)',
    heroHeadline: 'Deterministic LUFS Loudness Checker (ITU-R BS.1770-4)',
    heroSubtitle: 'Know your exact Integrated LUFS, Short-term max, and Loudness Range (LRA) across single tracks and album batches.',
    keyPoints: [
      { title: 'Integrated Loudness', desc: 'Gated program loudness calculated across the entire duration using K-weighting filtering.' },
      { title: 'Loudness Range (LRA)', desc: 'Statistical distribution of dynamics between quiet verses and loud climaxes in LU units.' },
      { title: 'Target Normalization', desc: 'Never worry about your music getting squashed or turned down by streaming algorithms.' }
    ],
    targetTable: [
      { platform: 'Spotify / Apple Music', targetLufs: '-14 to -16 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Optimized streaming profile for online distribution.' },
      { platform: 'Tidal', targetLufs: '-14 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Applies volume normalization based on BS.1770-4 standard.' },
      { platform: 'Amazon Music', targetLufs: '-14 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Normalizes both albums and single tracks.' },
      { platform: 'Podcasts (PRX / Spotify)', targetLufs: '-16 to -19 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Industry dialogue standard for podcasts and broadcast journalism.' }
    ]
  },
  'wav-checker': {
    title: 'WAV File Checker',
    metaTitle: 'WAV File Checker — Inspect Sample Rate, Bit Depth & Peak | Sonichecks',
    metaDescription: 'Inspect WAV files for true peak, clipping, sample rate integrity, bit depth (16/24-bit), and delivery compliance.',
    badge: 'PCM & WAV Validator',
    targetProfileId: 'standard',
    targetProfileName: 'Standard Delivery',
    heroHeadline: 'Complete WAV Audio Inspection & Validation',
    heroSubtitle: 'Confirm sample rate (44.1k/48k/96k), bit depth (16/24/32-bit), channel layout, and true peak before delivery.',
    keyPoints: [
      { title: 'Header & Codec Validation', desc: 'Validates uncompressed PCM headers, channel mapping, and sample counts.' },
      { title: '4x Polyphase True Peak', desc: 'Inspects inter-sample overshoots that analog DACs and lossy converters reproduce as distortion.' },
      { title: 'Immediate PDF Certification', desc: 'Download timestamped verification certificates proving master file integrity.' }
    ],
    targetTable: [
      { platform: 'CD Standard', targetLufs: '-14 to -9 LUFS', maxTruePeak: '-0.2 dBTP', notes: '44.1 kHz / 16-bit Red Book standard.' },
      { platform: 'Hi-Res Audio', targetLufs: 'Dynamic', maxTruePeak: '-1.0 dBTP', notes: '48 kHz / 96 kHz at 24-bit PCM.' }
    ]
  },
  'audio-file-validator': {
    title: 'Audio File Validator',
    metaTitle: 'Audio File Validator — Detect Corrupted Audio & Format Errors | Sonichecks',
    metaDescription: 'Validate audio files for format corruption, header integrity, silence defects, and clipping runs.',
    badge: 'Audio File Validator',
    targetProfileId: 'standard',
    targetProfileName: 'Standard Delivery',
    heroHeadline: 'Audio File Validator & Quality Inspection',
    heroSubtitle: 'Ensure audio files are clean, free of digital clipping, and ready for commercial ingestion pipelines.',
    keyPoints: [
      { title: 'Corruption Protection', desc: 'Identifies unrenderable files, damaged headers, and corrupted codecs.' },
      { title: 'Silence & Dead Air Audit', desc: 'Flags unintended long leading silence or missing head room tone.' },
      { title: 'Clipping Detection', desc: 'Catches hard digital clipping before audio reaches distributor quality checks.' }
    ],
    targetTable: [
      { platform: 'Digital Ingestion Gate', targetLufs: 'Any', maxTruePeak: '< 0 dBFS', notes: 'Zero hard flat-top clipping tolerance on commercial distribution.' },
      { platform: 'Audio Master Delivery', targetLufs: '-14 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Preserves transient headroom during MP3 / AAC lossy transcoding.' }
    ]
  },
  'audio-delivery-checker': {
    title: 'Audio Delivery Checker',
    metaTitle: 'Audio Delivery Standards Checker — Streaming, Broadcast & ACX | Sonichecks',
    metaDescription: 'Verify master audio deliverables against strict delivery specs for streaming services, broadcast networks, and audiobook platforms.',
    badge: 'Delivery Compliance',
    targetProfileId: 'streaming',
    targetProfileName: 'Streaming (Spotify / Apple Music)',
    heroHeadline: 'Automated Audio Delivery Compliance Checker',
    heroSubtitle: 'Test your audio against strict technical standards for Spotify, Apple Music, Audible (ACX), and EBU R128 Broadcast.',
    keyPoints: [
      { title: 'Target Profiles', desc: 'Pre-configured compliance rules for Streaming, Broadcast EBU R128, ACX Audiobook, and Club Masters.' },
      { title: 'Consistency Checks', desc: 'Verify all tracks in your release share matching sample rates, bit depths, and channel configurations.' },
      { title: 'One-Click Certification', desc: 'Generate cryptographic PDF inspection certificates with track SHA-256 hashes.' }
    ],
    targetTable: [
      { platform: 'Streaming (Spotify / Apple)', targetLufs: '-14 to -16 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Target delivery profile for all major digital streaming services.' },
      { platform: 'Audiobook (ACX / Audible)', targetLufs: '-23 to -18 LUFS', maxTruePeak: '-3.0 dBTP', notes: 'Spoken-word requirement: 44.1 kHz, 16-bit, and noise floor below -60 dB.' },
      { platform: 'Broadcast (EBU R128)', targetLufs: '-23.0 LUFS', maxTruePeak: '-1.0 dBTP', notes: 'Standard European broadcast audio specification.' },
      { platform: 'Club / DJ Master', targetLufs: '-9 to -6 LUFS', maxTruePeak: '-0.1 dBTP', notes: 'High-energy master profile for dance and DJ playback.' }
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(SEO_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const content = SEO_CONTENT[resolvedParams.slug];
  if (!content) return { title: 'Audio QC Checker' };

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: {
      canonical: `/${resolvedParams.slug}`
    },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      type: 'website'
    }
  };
}

export default async function SeoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const content = SEO_CONTENT[resolvedParams.slug];

  if (!content) {
    notFound();
  }

  const checkUrl = `/check?profile=${content.targetProfileId}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <FileAudio className="w-3.5 h-3.5" />
            <span>{content.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {content.heroHeadline}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {content.heroSubtitle}
          </p>
          <div className="pt-2">
            <Link
              href={checkUrl}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Inspect Audio with {content.targetProfileName} &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Quick QC Delivery Target Presets */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Or Choose Another Preset Target:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/check?profile=standard"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                content.targetProfileId === 'standard' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Standard Delivery</span>
            </Link>
            <Link
              href="/check?profile=streaming"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                content.targetProfileId === 'streaming' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Headphones className="w-3 h-3 text-emerald-400" />
              <span>Streaming</span>
            </Link>
            <Link
              href="/check?profile=broadcast_ebu"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                content.targetProfileId === 'broadcast_ebu' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3 text-blue-400" />
              <span>Broadcast EBU R128</span>
            </Link>
            <Link
              href="/check?profile=acx_audiobook"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                content.targetProfileId === 'acx_audiobook' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Mic className="w-3 h-3 text-amber-400" />
              <span>Audiobook ACX</span>
            </Link>
            <Link
              href="/check?profile=club_loud"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                content.targetProfileId === 'club_loud' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span>Club Master</span>
            </Link>
          </div>
        </div>

        {/* Key QC Checks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {content.keyPoints.map((pt, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>{pt.title}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {pt.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Platform Targets Table */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">
            Platform Quality Specifications Reference
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Platform / Standard</th>
                  <th className="py-2.5 px-3">Target Loudness</th>
                  <th className="py-2.5 px-3">True Peak Ceiling</th>
                  <th className="py-2.5 px-3">Technical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {content.targetTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-white">{row.platform}</td>
                    <td className="py-3 px-3 font-mono text-cyan-400">{row.targetLufs}</td>
                    <td className="py-3 px-3 font-mono text-amber-400">{row.maxTruePeak}</td>
                    <td className="py-3 px-3 text-slate-400">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Ready to inspect your masters?</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Drop your WAV, AIFF, FLAC, or MP3 files into the Sonichecks workspace and get an instant PASS/FAIL report.
          </p>
          <Link
            href={checkUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-md shadow-cyan-500/20"
          >
            <span>Open Audio QC with {content.targetProfileName}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
