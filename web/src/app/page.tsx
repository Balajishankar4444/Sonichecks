import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Volume2, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ArrowRight, 
  Sparkles, 
  FileAudio, 
  Lock, 
  Cpu,
  Mic,
  Headphones,
  Radio,
  FileCheck2,
  Music,
  Disc,
  Check,
  Zap,
  Activity,
  CreditCard,
  Fingerprint,
  Gauge,
  ScanLine,
  Upload,
  Play,
  ChevronDown
} from 'lucide-react';
import { getFaqSchema } from '@/lib/seo/structured-data';

const FAQ_ITEMS = [
  {
    question: "What is an audio quality checker?",
    answer: "An audio quality checker is a specialized digital signal processing inspection tool that audits audio files for compliance with loudness standards (LUFS), True Peak ceilings (dBTP), sample clipping, silence, and technical container properties before commercial distribution or client delivery."
  },
  {
    question: "How do I check the LUFS of an audio file?",
    answer: "You can check the LUFS of your audio file by dropping it into Sonichecks. The engine applies ITU-R BS.1770-4 K-weighting pre-filters to compute Integrated Loudness, Short-Term maximums, Momentary loudness, and Loudness Range (LRA) in seconds."
  },
  {
    question: "What is a good LUFS level for streaming?",
    answer: "For major digital streaming services, masters commonly target an Integrated Loudness between -16.0 LUFS and -14.0 LUFS with a True Peak ceiling of -1.0 dBTP to avoid downstream volume normalization attenuation and lossy transcoding distortion."
  },
  {
    question: "What is true peak in audio?",
    answer: "True Peak measures the actual maximum analog signal level reconstructed by digital-to-analog converters (DACs) using 4x polyphase oversampling interpolation. It catches inter-sample peaks that standard 0 dBFS sample meters miss."
  },
  {
    question: "How do I check if an audio file is clipping?",
    answer: "Sonichecks analyzes every individual sample across all channels, identifying consecutive samples that reach digital full scale (0 dBFS). It reports the exact clipped sample count, timestamps, and severity of digital flat-top clipping."
  },
  {
    question: "How do I validate a WAV file?",
    answer: "Validating a WAV file involves inspecting its uncompressed PCM header, verifying sample rate (such as 44.1 kHz or 48 kHz), bit depth (16-bit, 24-bit, or 32-bit float), channel count, container integrity, and ensuring no corrupted audio frames exist."
  },
  {
    question: "What should I check before delivering a master?",
    answer: "Before delivering a master, always verify Integrated LUFS, maximum True Peak (dBTP), zero digital clipping, lead-in and lead-out silence duration, correct sample rate and bit depth, and consistent album-wide loudness across multi-track batches."
  },
  {
    question: "What is audio QC?",
    answer: "Audio QC (Quality Control) is the pre-release technical validation process used by mastering engineers, recording studios, and distributors to guarantee audio deliverables meet platform ingestion requirements and sound flawless across playback systems."
  },
  {
    question: "How do I check audio before uploading it?",
    answer: "Simply stage your WAV, MP3, FLAC, or AIFF master into Sonichecks, select your delivery target profile (such as Streaming, Broadcast EBU R128, or Audiobook ACX), and receive an automated PASS/WARNING/FAIL verdict with recommended limiter adjustments."
  },
  {
    question: "Can Sonichecks check my audio without uploading it to a server?",
    answer: "Yes. Supported uncompressed WAV files are processed 100% locally inside your browser using the Web Audio API and Web Workers with zero audio upload required. Encoded non-WAV files use our secure reference engine."
  }
];

export default function LandingPage() {
  const faqSchema = getFaqSchema(FAQ_ITEMS);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-slate-100 selection:bg-cyan-400/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/[0.08] blur-[140px]" />
        <div className="absolute right-[-250px] top-[35%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pb-32 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3.5 py-2 text-xs font-bold text-cyan-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              PROFESSIONAL AUDIO QC &bull; DETERMINISTIC DSP
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Your master.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                Pass or fail.
              </span>
              <br />
              Know before you deliver.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg font-normal">
              Sonichecks analyzes your audio file against technical delivery requirements so you can find problems before a distributor, platform, broadcaster, publisher, or client does.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/check"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-400 px-7 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-400/30"
              >
                <Upload className="h-4 w-4" />
                Check My Audio
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#workflow"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-7 py-4 text-sm font-bold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <Play className="h-4 w-4 text-cyan-400" />
                See how it works
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                WAV can stay on-device
              </span>

              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                Deterministic DSP
              </span>

              <span className="flex items-center gap-1.5">
                <Fingerprint className="h-3.5 w-3.5 text-blue-400" />
                SHA-256 reports
              </span>
            </div>
          </div>

          {/* QC Console Preview */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-cyan-500/[0.08] blur-3xl" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[#090d13] shadow-2xl shadow-black/60">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>

                  <span className="ml-1 font-mono text-[10px] text-slate-400">
                    EXAMPLE QC REPORT &bull; AUDIT_VERIFIED.WAV
                  </span>
                </div>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-300">
                  PASS
                </span>
              </div>

              <div className="p-5">
                <div className="rounded-xl border border-slate-800 bg-[#06090e] p-4">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <div className="font-mono text-xs text-slate-500">
                        MASTER_FINAL_01
                      </div>

                      <div className="mt-1 text-sm font-bold text-white">
                        Midnight Drive (Final Master).wav
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        overall
                      </div>

                      <div className="font-mono text-lg font-black text-emerald-400">
                        98 / 100
                      </div>
                    </div>
                  </div>

                  {/* Waveform graphic */}
                  <div className="flex h-24 items-center gap-[2px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 px-3">
                    {Array.from({ length: 74 }).map((_, i) => {
                      const h = 12 + ((i * 17) % 54) + (i % 7) * 3;

                      return (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-cyan-400/70"
                          style={{
                            height: `${Math.min(h, 78)}%`,
                          }}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ['LUFS', '-14.2', 'PASS'],
                      ['TRUE PEAK', '-1.3', 'PASS'],
                      ['CLIPPING', '0', 'PASS'],
                      ['SILENCE', '0.2s', 'PASS'],
                    ].map(([label, value, status]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                      >
                        <div className="text-[9px] font-bold tracking-wider text-slate-500">
                          {label}
                        </div>

                        <div className="mt-1 font-mono text-sm font-black text-white">
                          {value}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                          <Check className="h-3 w-3" />
                          {status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[9px] text-slate-500">FORMAT</div>
                    <div className="mt-1 font-mono text-xs font-bold text-white">
                      48 kHz / 24-bit
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[9px] text-slate-500">CHANNELS</div>
                    <div className="mt-1 font-mono text-xs font-bold text-white">
                      Stereo (2 Ch)
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[9px] text-slate-500">PROFILE</div>
                    <div className="mt-1 font-mono text-xs font-bold text-cyan-300">
                      Streaming Target
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HIGH-INTENT PROBLEM SECTION */}
      <section className="border-t border-slate-900 bg-slate-950/60 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Technical Pre-Delivery Inspection
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Is Your Audio Actually Ready to Deliver?
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-300">
              You finished the mix. The master sounds right. But is the file technically correct? An audio file can sound completely fine during playback and still fail distributor ingest or trigger severe streaming normalization penalties because of hidden digital signal defects.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Excessive Loudness',
                desc: 'Over-compressed masters get aggressively attenuated by streaming normalization algorithms, reducing impact.',
                icon: Volume2,
                tag: 'Loudness Penalty'
              },
              {
                title: 'True-Peak Overs',
                desc: 'Inter-sample peaks above -1.0 dBTP distort when lossy encoders convert WAV to AAC, MP3, or OGG.',
                icon: Activity,
                tag: 'Codec Distortion'
              },
              {
                title: 'Hard Digital Clipping',
                desc: 'Consecutive full-scale flat-top samples cause harsh digital crackle on consumer playback DACs.',
                icon: AlertTriangle,
                tag: 'Sample Clipping'
              },
              {
                title: 'Sample Rate Mismatches',
                desc: 'Submitting 44.1 kHz when 48 kHz is mandated for video sync causes pitch shifting or ingest rejection.',
                icon: FileAudio,
                tag: 'Format Ingestion'
              },
              {
                title: 'Bit Depth Discrepancies',
                desc: 'Truncating 24-bit masters to 16-bit without proper triangular dither introduces harmonic quantization noise.',
                icon: Layers,
                tag: 'Dither & Noise'
              },
              {
                title: 'Unexpected Silence',
                desc: 'Missing lead-in silence clips the initial transient, while excessive tail silence causes delivery rejection.',
                icon: Sliders,
                tag: 'Lead-in / Lead-out'
              },
              {
                title: 'Wrong Channel Layout',
                desc: 'Accidental dual-mono routing or phase cancellation across stereo channels ruins spatial image playback.',
                icon: Headphones,
                tag: 'Phase & Stereo'
              },
              {
                title: 'Profile Violations',
                desc: 'Failing spoken-word noise floor floors (ACX) or European broadcast loudness gates (EBU R128).',
                icon: ShieldCheck,
                tag: 'Delivery Profiles'
              }
            ].map(({ title, desc, icon: Icon, tag }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-cyan-500/40 hover:bg-slate-900/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    {tag}
                  </span>
                </div>

                <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SEARCH-INTENT SEO SECTION */}
      <section className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-14">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Technical Capabilities
            </div>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Audio Quality Control for Every Delivery
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Sonichecks is built as a complete technical quality control inspection system designed for modern mastering, streaming, broadcast, and spoken-word distribution.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Audio Quality Checker */}
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 space-y-4 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Audio Quality Checker</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  A comprehensive technical audit of digital masters prior to distribution. Sonichecks verifies dynamic range, loudness, peak headroom, sample clipping, and file format specifications to eliminate release defects.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80">
                <Link
                  href="/audio-quality-checker"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Explore Audio Quality Checker</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>

            {/* LUFS & Loudness Checking */}
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 space-y-4 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Volume2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">LUFS &amp; Loudness Checking</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Measure Integrated LUFS, Short-Term Loudness max, Momentary Loudness, and Loudness Range (LRA) using standardized ITU-R BS.1770-4 K-weighting filtering to ensure dynamic balance and prevent streaming volume attenuation.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80">
                <Link
                  href="/loudness-checker"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Run a LUFS &amp; Loudness Check</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>

            {/* True Peak & Clipping Detection */}
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 space-y-4 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">True Peak &amp; Clipping Detection</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Calculates 4x polyphase oversampled True Peak (dBTP) to detect inter-sample peaks that standard meters miss. Pinpoints consecutive flat-top digital clipping runs with exact sample counts and timestamps.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80">
                <Link
                  href="/check"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Analyze True Peak &amp; Clipping</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>

            {/* WAV File Validation */}
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 space-y-4 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <FileAudio className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">WAV File Validation</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Inspect uncompressed PCM headers for sample rate uniformity (44.1 kHz, 48 kHz, 96 kHz, 192 kHz), bit depth integrity (16, 24, 32-bit float), channel count, and file duration to prevent ingestion errors.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80">
                <Link
                  href="/wav-checker"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Verify WAV Technical Properties</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>

            {/* Audio Delivery QC */}
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 space-y-4 hover:border-cyan-500/40 transition-colors flex flex-col justify-between md:col-span-2 lg:col-span-2">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Audio Delivery QC &amp; Batch Verification</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Before delivering final masters to clients, labels, aggregators, or broadcasters, audit entire multi-track release packages simultaneously. The Batch QC Comparison Matrix cross-references loudness variance, sample rates, and channel layouts across all album tracks.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-4">
                <Link
                  href="/audio-delivery-checker"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Audio Delivery Checker</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/audio-qc"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-cyan-300"
                >
                  <span>Comprehensive Audio QC</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 4. "WHAT CAN GO WRONG?" SECTION */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/70">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-400">
              Hidden Delivery Risks
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              The File Can Sound Fine and Still Fail QC
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Listening alone cannot catch inter-sample peaks, container bit depth truncation, or platform gate violations. See what happens when uninspected files are submitted versus verified with Sonichecks:
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Fail State Card */}
            <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-slate-950 p-7 sm:p-9 space-y-6 shadow-2xl shadow-rose-950/30">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-rose-400" />
                    <span>Unchecked Master Delivery</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Common hidden technical defects caught too late</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  REJECTED / WARNED
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-900/40 flex items-start gap-3">
                  <span className="text-rose-400 font-bold font-mono text-sm">&times;</span>
                  <div>
                    <span className="font-bold text-white block">LUFS Outside Target (-8.1 LUFS)</span>
                    <span className="text-slate-400">Triggers harsh automatic volume attenuation on streaming platforms.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-900/40 flex items-start gap-3">
                  <span className="text-rose-400 font-bold font-mono text-sm">&times;</span>
                  <div>
                    <span className="font-bold text-white block">True Peak Too High (+1.4 dBTP)</span>
                    <span className="text-slate-400">Inter-sample overs distort during lossy AAC / MP3 encoding.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-900/40 flex items-start gap-3">
                  <span className="text-rose-400 font-bold font-mono text-sm">&times;</span>
                  <div>
                    <span className="font-bold text-white block">Digital Clipping Detected (48 samples)</span>
                    <span className="text-slate-400">Flat-top full-scale sample clipping creates audible digital crunch.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-900/40 flex items-start gap-3">
                  <span className="text-rose-400 font-bold font-mono text-sm">&times;</span>
                  <div>
                    <span className="font-bold text-white block">Missing Lead-In Silence (0.0s)</span>
                    <span className="text-slate-400">Leading transient is truncated upon platform ingest and player buffering.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pass State Card */}
            <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-slate-950 p-7 sm:p-9 space-y-6 shadow-2xl shadow-cyan-950/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>Sonichecks Verified Master</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Full compliance across loudness, peak, and format</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PASS &bull; VERIFIED
                  </span>
                </div>

                <div className="space-y-3 text-xs pt-6">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-900/40 flex items-start gap-3">
                    <Check className="text-emerald-400 font-bold h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Integrated Loudness Compliant (-14.2 LUFS)</span>
                      <span className="text-slate-300">Optimal dynamics preserved without unexpected volume drops.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-900/40 flex items-start gap-3">
                    <Check className="text-emerald-400 font-bold h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">True Peak Controlled (-1.3 dBTP)</span>
                      <span className="text-slate-300">Sufficient headroom guarantees clean lossy transcoding.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-900/40 flex items-start gap-3">
                    <Check className="text-emerald-400 font-bold h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Zero Digital Clipping (0 samples)</span>
                      <span className="text-slate-300">Clean headroom across all channels with full transient integrity.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-900/40 flex items-start gap-3">
                    <Check className="text-emerald-400 font-bold h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Technical Specs &amp; SHA-256 Verified</span>
                      <span className="text-slate-300">48 kHz / 24-bit PCM container with cryptographic audit certificate.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/check"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Audit Your File with Sonichecks</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DELIVERY PROFILES */}
      <section className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Delivery Standards
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Check Against the Requirements That Matter
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Different delivery destinations impose different technical standards. Sonichecks provides purpose-built QC profiles configured for commercial distribution channels.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                id: 'standard',
                name: 'Standard Delivery',
                desc: 'Universal mastering profile for client deliverables and general archive.',
                icon: Layers,
                target: 'True Peak ≤ -1.0 dBTP'
              },
              {
                id: 'streaming',
                name: 'Streaming',
                desc: 'Optimized for digital streaming aggregators to avoid loudness penalties.',
                icon: Headphones,
                target: '-14 LUFS / -1.0 dBTP'
              },
              {
                id: 'broadcast_ebu',
                name: 'Broadcast (EBU R128)',
                desc: 'European television and radio loudness standard with strict gating.',
                icon: Radio,
                target: '-23.0 LUFS ±0.5 LU'
              },
              {
                id: 'acx_audiobook',
                name: 'Audiobook (ACX)',
                desc: 'Strict spoken-word audiobook specifications with noise floor gates.',
                icon: Mic,
                target: '-23 to -18 LUFS'
              },
              {
                id: 'club_loud',
                name: 'Club / DJ Master',
                desc: 'High-energy electronic and dance music masters for club sound systems.',
                icon: Volume2,
                target: '-9 to -6 LUFS'
              }
            ].map(({ id, name, desc, icon: Icon, target }) => (
              <Link
                key={id}
                href={`/check?profile=${id}`}
                className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between space-y-4 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                    {name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 font-mono text-[11px] font-bold text-cyan-400">
                  {target}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (WORKFLOW) */}
      <section id="workflow" className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Simple 3-Step Process
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              How Sonichecks Audio QC Works
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Three simple steps to audit your masters and verify technical release compliance.
            </p>
          </div>

          <div className="relative grid gap-5 lg:grid-cols-3">
            {[
              {
                num: 1,
                Icon: Upload,
                title: 'Choose your audio',
                text: 'Select a track or batch (WAV, MP3, FLAC, AIFF) and choose the delivery profile that matches your workflow.',
              },
              {
                num: 2,
                Icon: Activity,
                title: 'Run the inspection',
                text: 'Sonichecks calculates loudness, True Peak, clipping, silence and technical file properties.',
              },
              {
                num: 3,
                Icon: ShieldCheck,
                title: 'Get your verdict',
                text: 'See clear PASS, WARNING or FAIL results and export professional QC reports on supported plans.',
              },
            ].map(({ num, Icon, title, text }) => (
              <div
                key={num}
                className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-7"
              >
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                  <Icon className="h-5 w-5" />

                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 font-mono text-[9px] font-bold text-cyan-300 ring-1 ring-cyan-400/20">
                    {num}
                  </span>
                </div>

                <h3 className="mt-8 text-lg font-bold text-white">
                  {title}
                </h3>

                <p className="mt-2 text-xs leading-6 text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SIMPLE AUDIO QC PRICING */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/70">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Pricing
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Simple Audio QC Pricing
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Start with free audio quality checks and upgrade for higher monthly volume, batch analysis, reports, and professional workflows.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Free</h3>
                  <p className="text-xs text-slate-400 mt-1">For single-file QC checks.</p>
                </div>
                <div className="text-4xl font-black text-white">
                  €0<span className="text-sm font-normal text-slate-400">/month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 5 files / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Single-file QC processing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Full deterministic DSP analysis</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> LUFS, True Peak, Clipping &amp; Silence</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Detailed fixes &amp; recommendations</li>
                  <li className="flex items-center gap-2 text-slate-500 line-through">Batch processing &amp; QC Matrix</li>
                  <li className="flex items-center gap-2 text-slate-500 line-through">PDF Reports &amp; CSV export</li>
                </ul>
              </div>
              <Link
                href="/check"
                className="w-full py-3.5 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors block"
              >
                Start Free
              </Link>
            </div>

            {/* Pro */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-950/70 space-y-6 flex flex-col justify-between relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-md">
                Recommended
              </span>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <p className="text-xs text-cyan-400 mt-1">For independent audio professionals.</p>
                </div>
                <div className="text-4xl font-black text-white">
                  €4.99<span className="text-sm font-normal text-slate-400">/month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 100 files / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Batch QC (up to 50 files per batch)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Batch QC Comparison Matrix</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Professional PDF QC Certificate</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> SHA-256 file hashes in reports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> CSV Batch Export</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Standard &amp; Custom QC Profiles</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="w-full py-3.5 rounded-xl font-bold text-xs text-center text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all block"
              >
                <CreditCard className="w-4 h-4" />
                <span>Choose Pro</span>
              </Link>
            </div>

            {/* Studio */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Studio</h3>
                  <p className="text-xs text-slate-400 mt-1">For studios and high-volume workflows.</p>
                </div>
                <div className="text-4xl font-black text-white">
                  €14.99<span className="text-sm font-normal text-slate-400">/month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 500 files / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 200-file bulk batches</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Multi-track Project organization</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Client/Project organization</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Priority processing queue</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Everything in Pro included</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="w-full py-3.5 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-2 transition-all shadow-md block"
              >
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Choose Studio</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. EXPANDED HIGH-INTENT FAQ */}
      <section id="faq" className="border-t border-slate-900 bg-slate-950 py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              FAQ
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Frequently Asked Questions About Audio QC
            </h2>
            <p className="text-slate-400 text-sm">
              Answers to common questions regarding audio quality control, loudness meters, true peaks, and delivery validation.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-bold text-white">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
                </summary>

                <p className="max-w-3xl pt-4 text-xs leading-6 text-slate-400">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative overflow-hidden py-28 border-t border-slate-900 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.04] to-cyan-500/[0.07]" />

        <div className="relative mx-auto max-w-4xl px-5 sm:px-8 space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-xl shadow-cyan-950/40">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
            Don&apos;t guess.
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Check it.
            </span>
          </h2>

          <p className="mx-auto max-w-lg text-sm leading-6 text-slate-400">
            Catch loudness problems, True Peak overs and clipping before the file reaches your client, label or distributor.
          </p>

          <div className="pt-4">
            <Link
              href="/check"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-400 px-8 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-0.5"
            >
              <Zap className="h-4 w-4" />
              <span>Check My Audio Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}