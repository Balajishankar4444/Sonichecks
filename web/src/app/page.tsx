import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Volume2,
  Sliders,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
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
  Fingerprint,
  Gauge,
  ScanLine,
  Upload,
  Play,
  ChevronDown,
} from 'lucide-react';
import { getFaqSchema } from '@/lib/seo/structured-data';

const FAQ_ITEMS = [
  {
    question: 'What is an audio quality checker?',
    answer:
      'An audio quality checker is a technical inspection tool that analyzes digital audio files for compliance with loudness standards, peak ceilings, format integrity, silence, and distortion prior to commercial release or client delivery.',
  },
  {
    question: 'What does audio QC mean?',
    answer:
      'Audio QC (Quality Control) is the pre-delivery verification process where mastering engineers, producers, and distributors audit audio files against digital signal processing specifications to prevent streaming normalization penalties, inter-sample clipping, or platform ingest rejections.',
  },
  {
    question: 'Can Sonichecks check LUFS?',
    answer:
      'Yes. Sonichecks computes Integrated LUFS, Short-Term LUFS, Momentary Loudness, and Loudness Range (LRA) using standard ITU-R BS.1770-4 K-weighting filtering.',
  },
  {
    question: 'Can Sonichecks detect True Peak?',
    answer:
      'Yes. Sonichecks calculates True Peak in dBTP using 4x polyphase oversampling to detect inter-sample peaks that standard sample meters miss.',
  },
  {
    question: 'Can Sonichecks detect clipping?',
    answer:
      'Yes. Sonichecks inspects audio files for consecutive flat-top digital full-scale samples and reports exact sample counts and time locations.',
  },
  {
    question: 'Can I check a WAV file without uploading it?',
    answer:
      'Yes. Supported uncompressed WAV files can be analyzed locally inside your browser using the Web Audio API and Web Workers with zero audio upload required.',
  },
  {
    question: 'What audio formats does Sonichecks support?',
    answer:
      'Sonichecks supports WAV files via Local Browser DSP, as well as MP3, FLAC, AIFF, AAC, M4A, and OGG formats using the reference analysis engine.',
  },
  {
    question: 'Is Sonichecks an AI mastering tool?',
    answer:
      'No. Sonichecks is not an AI mastering tool or audio processor. It does not alter, EQ, compress, or modify your audio. It is a deterministic quality-control inspection tool.',
  },
];

const checks = [
  ['LUFS', 'Integrated & short-term loudness', Volume2],
  ['TRUE PEAK', '4x oversampled dBTP', Activity],
  ['CLIPPING', 'Sample-level detection', AlertTriangle],
  ['FORMAT', 'Sample rate, depth & channels', FileAudio],
  ['SILENCE', 'Head & tail inspection', Sliders],
  ['BATCH', 'Album consistency checks', Layers],
] as const;

const profiles = [
  {
    name: 'Standard',
    detail: 'Everyday master delivery',
    icon: Layers,
  },
  {
    name: 'Streaming',
    detail: 'Digital release targets',
    icon: Headphones,
  },
  {
    name: 'Broadcast',
    detail: 'EBU R128 workflows',
    icon: Radio,
  },
  {
    name: 'Audiobook',
    detail: 'ACX / Audible checks',
    icon: Mic,
  },
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

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pb-32 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3.5 py-2 text-xs font-bold text-cyan-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              PROFESSIONAL AUDIO QC · DETERMINISTIC DSP
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

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Drop in your audio and get a technical QC verdict in seconds —
              loudness, True Peak, clipping, silence, format integrity and more.
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

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
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

          {/* QC Console */}
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

                  <span className="ml-1 font-mono text-[10px] text-slate-500">
                    QC / TRACK_014.WAV
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
                        Midnight Drive.wav
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-slate-600">
                        overall
                      </div>

                      <div className="font-mono text-lg font-black text-emerald-400">
                        98 / 100
                      </div>
                    </div>
                  </div>

                  {/* Waveform */}
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
                      Stereo
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[9px] text-slate-500">PROFILE</div>
                    <div className="mt-1 font-mono text-xs font-bold text-cyan-300">
                      Streaming
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/10">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">
                      Ready to deliver
                    </div>

                    <div className="truncate text-[10px] text-slate-500">
                      All selected QC checks passed
                    </div>
                  </div>

                  <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Profiles */}
        <div className="mt-16 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            <Gauge className="h-3.5 w-3.5 text-cyan-400" />
            Start with a delivery profile
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {profiles.map((profile) => {
              const Icon = profile.icon;

              return (
                <Link
                  key={profile.name}
                  href={`/check?profile=${profile.name.toLowerCase()}`}
                  className="group rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900"
                >
                  <Icon className="h-4 w-4 text-cyan-400" />

                  <div className="mt-3 text-xs font-bold text-white">
                    {profile.name}
                  </div>

                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {profile.detail}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Problem / Value */}
      <section className="border-y border-slate-900 bg-slate-950/70 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <div className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                The last check before send
              </div>

              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Don&apos;t discover a QC problem after delivery.
              </h2>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Mastering meters tell you what your audio is doing. Sonichecks
              turns those measurements into a clear delivery decision: what
              passed, what failed, and what you should inspect before the file
              leaves your studio.
            </p>
          </div>

          <div
            id="checks"
            className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {checks.map(([title, detail, Icon], index) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/[0.04] blur-2xl transition group-hover:bg-cyan-400/[0.1]" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="font-mono text-[10px] text-slate-700">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-7 text-base font-bold text-white">
                    {title}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Processing */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950">
            <div className="grid lg:grid-cols-[1fr_.9fr]">
              <div className="p-8 sm:p-12 lg:p-14">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <Lock className="h-5 w-5" />
                </div>

                <div className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-400">
                  Privacy-first workflow
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Your WAV doesn&apos;t have to leave your browser.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
                  Supported WAV files can be decoded and analyzed locally using
                  browser-side processing. For encoded formats, Sonichecks uses
                  the reference processing engine.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    ['01', 'Select WAV', 'File stays on your device'],
                    ['02', 'Decode locally', 'Web Audio + worker processing'],
                    ['03', 'Measure', 'Loudness, peaks & clipping'],
                    ['04', 'Get verdict', 'Instant QC result'],
                  ].map(([num, title, detail]) => (
                    <div
                      key={num}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <span className="font-mono text-[10px] text-cyan-400">
                        {num}
                      </span>

                      <div className="mt-2 text-xs font-bold text-white">
                        {title}
                      </div>

                      <div className="mt-1 text-[10px] leading-5 text-slate-500">
                        {detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[360px] overflow-hidden border-t border-slate-800 bg-[#06090e] lg:border-l lg:border-t-0">
                <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] [background-size:32px_32px]" />

                <div className="absolute inset-x-10 top-1/2 h-px bg-cyan-400/20" />

                <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.07] blur-3xl" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[78%] rounded-2xl border border-cyan-400/20 bg-slate-950/90 p-5 shadow-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileAudio className="h-4 w-4 text-cyan-400" />
                      browser-worker.dsp
                    </div>

                    <div className="mt-5 space-y-3 font-mono text-[10px]">
                      <div className="flex justify-between text-slate-500">
                        <span>decode</span>
                        <span className="text-emerald-400">complete</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-full rounded-full bg-cyan-400" />
                      </div>

                      <div className="flex justify-between text-slate-500">
                        <span>LUFS</span>
                        <span className="text-white">-14.2</span>
                      </div>

                      <div className="flex justify-between text-slate-500">
                        <span>True Peak</span>
                        <span className="text-white">-1.3 dBTP</span>
                      </div>

                      <div className="flex justify-between text-slate-500">
                        <span>Clipping</span>
                        <span className="text-emerald-400">0 samples</span>
                      </div>

                      <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-center font-bold text-emerald-300">
                        LOCAL ANALYSIS COMPLETE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="border-y border-slate-900 bg-slate-950/70 py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Three steps
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              From master to verdict.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              No complicated setup. Choose your profile, run the inspection,
              fix anything that fails.
            </p>
          </div>

          <div className="relative mt-16 grid gap-5 lg:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent lg:block" />

            {[
              {
                num: 1,
                Icon: Upload,
                title: 'Choose your audio',
                text: 'Select a track or batch and choose the delivery profile that matches your workflow.',
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

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deterministic DSP */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                Why Sonichecks
              </div>

              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Numbers you can trust.
                <span className="block text-slate-500">
                  Not AI guesswork.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400">
                Quality control is about repeatable measurements. Sonichecks
                uses mathematical DSP algorithms so the same audio produces the
                same readings.
              </p>

              <Link
                href="/check"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition hover:text-cyan-200"
              >
                Run a real check
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [
                  Cpu,
                  'ITU-R BS.1770-4',
                  'Standardized K-weighting and gated loudness integration.',
                ],
                [
                  Activity,
                  '4x True Peak',
                  'Polyphase oversampling catches inter-sample overshoots.',
                ],
                [
                  Fingerprint,
                  'Reproducible',
                  'Deterministic measurements give consistent numerical results.',
                ],
                [
                  FileCheck2,
                  'Delivery focused',
                  'Built around the final question: is this file ready to send?',
                ],
              ].map(([Icon, title, text]) => {
                const CardIcon = Icon as React.ComponentType<{
                  className?: string;
                }>;

                return (
                  <div
                    key={title as string}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
                  >
                    <CardIcon className="h-5 w-5 text-cyan-400" />

                    <h3 className="mt-5 text-sm font-bold text-white">
                      {title as string}
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {text as string}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="border-t border-slate-900 bg-slate-950/70 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                Built for
              </div>

              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Anyone who delivers audio.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              Producers, mastering engineers, studios, podcasters, audiobook
              creators, labels and distributors.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                Music,
                'Musicians & producers',
                'Check final bounces before sending them to distributors.',
              ],
              [
                Sliders,
                'Mastering engineers',
                'Run repeatable pre-delivery audits across tracks and albums.',
              ],
              [
                Disc,
                'Recording studios',
                'Catch technical export problems before client handoff.',
              ],
              [
                Radio,
                'Podcasters & broadcasters',
                'Validate loudness and delivery requirements.',
              ],
              [
                Mic,
                'Audiobook producers',
                'Inspect spoken-word files against your chosen profile.',
              ],
              [
                Layers,
                'Labels & distributors',
                'Batch-check releases and maintain consistent technical standards.',
              ],
            ].map(([Icon, title, text]) => {
              const AudienceIcon = Icon as React.ComponentType<{
                className?: string;
              }>;

              return (
                <div
                  key={title as string}
                  className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-cyan-400">
                    <AudienceIcon className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {title as string}
                    </h3>

                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      {text as string}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-xl text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Simple pricing
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Start free. Scale when you need it.
            </h2>

            <p className="mt-4 text-sm text-slate-500">
              No need to pay just to find out whether your master passes.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {[
              {
                name: 'Free',
                price: '€0',
                sub: 'For occasional checks',
                items: [
                  '5 files / month',
                  'Single-file QC',
                  'Full DSP analysis',
                  'LUFS, True Peak & clipping',
                  'Fix recommendations',
                ],
              },
              {
                name: 'Pro',
                price: '€4.99',
                sub: 'For audio professionals',
                items: [
                  '100 files / month',
                  'Batch QC up to 50 files',
                  'QC comparison matrix',
                  'Professional PDF certificate',
                  'SHA-256 hashes',
                  'CSV export',
                  'Custom QC profiles',
                ],
                featured: true,
              },
              {
                name: 'Studio',
                price: '€14.99',
                sub: 'For higher-volume workflows',
                items: [
                  '500 files / month',
                  '200-file bulk batches',
                  'Project organization',
                  'Client organization',
                  'Priority processing',
                  'Everything in Pro',
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl p-7 ${
                  plan.featured
                    ? 'border-2 border-cyan-400 bg-slate-900 shadow-2xl shadow-cyan-950/40'
                    : 'border border-slate-800 bg-slate-900/50'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-300 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-950">
                    Most popular
                  </span>
                )}

                <div className="text-sm font-bold text-white">
                  {plan.name}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {plan.sub}
                </div>

                <div className="mt-7 text-4xl font-black text-white">
                  {plan.price}
                  <span className="text-xs font-normal text-slate-500">
                    /month
                  </span>
                </div>

                <div className="my-6 h-px bg-slate-800" />

                <ul className="flex-1 space-y-3 text-xs text-slate-300">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/check"
                  className={`mt-8 inline-flex items-center justify-center rounded-xl px-4 py-3 text-xs font-black ${
                    plan.featured
                      ? 'bg-cyan-300 text-slate-950 hover:bg-cyan-200'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {plan.name === 'Free'
                    ? 'Start free'
                    : `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="border-t border-slate-900 bg-slate-950/70 py-24"
      >
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              FAQ
            </div>

            <h2 className="mt-3 text-4xl font-black text-white">
              Questions, answered.
            </h2>
          </div>

          <div className="mt-12 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-bold text-white">
                  {item.question}

                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
                </summary>

                <p className="max-w-3xl pt-4 text-xs leading-6 text-slate-500">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.04] to-cyan-500/[0.07]" />

        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-xl shadow-cyan-950/40">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h2 className="mt-7 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Don&apos;t guess.
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Check it.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-slate-500">
            Catch loudness problems, True Peak overs and clipping before the
            file reaches your client, label or distributor.
          </p>

          <Link
            href="/check"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-400 px-8 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-0.5"
          >
            <Zap className="h-4 w-4" />
            Check My Audio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}