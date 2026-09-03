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
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { getFaqSchema } from '@/lib/seo/structured-data';

export default function LandingPage() {
  const faqSchema = getFaqSchema([
    {
      question: "Is this an AI mastering tool?",
      answer: "No. Sonichecks is NOT an AI mastering tool. It does not alter, process, or equalize your audio. It is a deterministic quality-control tool that verifies whether your exported masters comply with delivery specifications (BS.1770-4 LUFS, True Peak, Clipping, and multi-track consistency)."
    },
    {
      question: "How are measurements calculated?",
      answer: "We calculate true measurements using standard digital signal processing algorithms: ITU-R BS.1770-4 K-weighting filters for LUFS loudness, 4x polyphase sinc interpolation for True Peak (dBTP), and hard digital full-scale sample analysis for clipping."
    },
    {
      question: "What happens to my uploaded audio files?",
      answer: "Privacy is strictly guaranteed. Sonichecks processes audio 100% locally in your browser client. Zero audio files or recordings are ever uploaded to remote servers."
    },
    {
      question: "What formats can I check?",
      answer: "We support WAV (16/24/32-bit), MP3, FLAC, AIFF, AAC, M4A, and OGG files locally in the browser."
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-28 lg:pb-32 overflow-hidden">
        {/* Subtle grid and glow effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-semibold shadow-lg shadow-cyan-950/50">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Deterministic Audio QC Engine &bull; Zero Hallucinations</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
            Know if your audio is{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              ready to deliver.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Upload your audio files and get an instant quality-control report for loudness, true peaks, format, silence, clipping, and multi-track consistency.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/check"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              <span>Check My Audio</span>
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-base text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <span>See How It Works</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Quick QC Delivery Target Presets */}
          <div className="pt-6 max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant QC Delivery Targets (Click to Preset):</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/check?profile=standard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all hover:scale-105 shadow-md shadow-slate-950/50"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Standard Delivery</span>
              </Link>

              <Link
                href="/check?profile=streaming"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all hover:scale-105 shadow-md shadow-slate-950/50"
              >
                <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                <span>Streaming (Spotify / Apple Music)</span>
              </Link>

              <Link
                href="/check?profile=broadcast_ebu"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all hover:scale-105 shadow-md shadow-slate-950/50"
              >
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>Broadcast (EBU R128)</span>
              </Link>

              <Link
                href="/check?profile=acx_audiobook"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all hover:scale-105 shadow-md shadow-slate-950/50"
              >
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span>Audiobook (ACX / Audible)</span>
              </Link>

              <Link
                href="/check?profile=club_loud"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all hover:scale-105 shadow-md shadow-slate-950/50"
              >
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Club / DJ Master</span>
              </Link>
            </div>
          </div>

          {/* Mini Guarantee */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              WAV, AIFF, FLAC, MP3
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ITU-R BS.1770-4 Standards
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Deterministic DSP
            </span>
          </div>
        </div>

        {/* 2. Interactive Mock Preview Card */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-cyan-950/30 overflow-hidden">
            {/* Header bar */}
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">Sonichecks Audio QC Inspection</span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PASS &bull; Standard Delivery
              </span>
            </div>

            {/* Content Preview */}
            <div className="p-6 space-y-4 font-sans text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-bold text-white text-base">Album_Master_Track01.wav</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">WAV &bull; 48.0 kHz &bull; 24-bit &bull; Stereo &bull; 3m 42s</p>
                </div>
                <span className="px-3 py-1 rounded-md text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PASS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Loudness</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">-14.2 LUFS</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">True Peak</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">-1.3 dBTP</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Clipping</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">None (0 smp)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Head/Tail Silence</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">0.2s / 0.5s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-20 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Quality Control in 3 Steps
            </h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Understand your audio deliverables within 5 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 font-black text-base flex items-center justify-center border border-cyan-500/20">
                1
              </div>
              <h4 className="text-lg font-bold text-white">Upload Deliverables</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag and drop single tracks or full album batches. We support uncompressed WAV, AIFF, FLAC, and high-bitrate MP3.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 font-black text-base flex items-center justify-center border border-cyan-500/20">
                2
              </div>
              <h4 className="text-lg font-bold text-white">Deterministic Inspection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our mathematical DSP engine calculates true peaks, integrated LUFS, inter-sample clipping, and silence energy against delivery profiles.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 font-black text-base flex items-center justify-center border border-cyan-500/20">
                3
              </div>
              <h4 className="text-lg font-bold text-white">Instant Verdict & Fixes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                See unambiguous PASS/FAIL verdicts, plain-English fix instructions, and download professional PDF QC certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features & Checks Grid */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Inspection Matrix</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Real Audio Analysis. No Guesswork.
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Loudness */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">ITU-R BS.1770-4 LUFS</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates Integrated LUFS, Short-term max, Momentary max, and Loudness Range (LRA) to ensure compliance with Spotify, Apple Music, and EBU R128.
              </p>
            </div>

            {/* True Peak */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">4x Oversampled True Peak</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interpolates inter-sample peaks with 4x polyphase filtering to detect hidden distortion before lossy MP3/AAC compression codecs transcode it.
              </p>
            </div>

            {/* Clipping */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Hard Digital Clipping</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scans for consecutive flat-topped sample runs hitting digital 0 dBFS. Tells you exactly how many clipped samples and events occurred.
              </p>
            </div>

            {/* Silence */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Head & Tail Silence</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Measures dead air at the beginning and end of tracks using -60 dBFS energy thresholds to prevent truncated audio or awkward pauses.
              </p>
            </div>

            {/* Consistency */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Multi-Track Consistency</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-references full album batches to detect mismatched sample rates (44.1k vs 48k), bit depths, mixed channels, or excessive loudness variance.
              </p>
            </div>

            {/* PDF & CSV */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">PDF & CSV Reports</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download formal QC inspection certificates for clients and label distributors with timestamped technical proof of compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Who It's For */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Built For Creators</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Who Uses Sonichecks?
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <Headphones className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">Musicians & Producers</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ensure master WAVs won&apos;t get turned down or distorted by Spotify and Apple Music loudness normalizers.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <Mic className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">Audiobook & ACX Artists</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pass strict Audible/ACX checks on the first submission with automatic -23 to -18 LUFS and room-tone verification.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <Radio className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">Podcasters & Editors</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain consistent dialogue loudness across episodes and catch clipping mic spikes before publishing.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <Cpu className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">Studios & Engineers</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Attach professional PDF QC reports to client deliverables to prove delivery specifications were met.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Simple Transparent Pricing</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Inexpensive, Professional Audio QC
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Start checking files for free. Upgrade as your studio volume grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white text-lg">Free</h4>
                  <p className="text-xs text-slate-400">For occasional spot checks</p>
                </div>
                <div className="text-3xl font-black text-white">
                  €0<span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 5 files / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Standard Delivery QC</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Full technical metrics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Single file analysis</li>
                </ul>
              </div>
              <Link
                href="/check"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Start Free Check
              </Link>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 shadow-xl shadow-cyan-950/40 space-y-6 flex flex-col justify-between relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950">
                Most Popular
              </span>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white text-lg">Pro</h4>
                  <p className="text-xs text-cyan-400">For active creators & producers</p>
                </div>
                <div className="text-3xl font-black text-white">
                  €4.99<span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 100 files / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Batch checking (up to 20 tracks)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> PDF QC Reports & CSV Export</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Streaming, EBU R128 & ACX Profiles</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Batch Consistency Analysis</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-center text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-md shadow-cyan-500/20 transition-all"
              >
                Get Started with Pro
              </Link>
            </div>

            {/* Studio */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white text-lg">Studio</h4>
                  <p className="text-xs text-slate-400">For mastering houses & labels</p>
                </div>
                <div className="text-3xl font-black text-white">
                  €14.99<span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 500 files / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 50-file bulk batches</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Branded PDF reports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Priority API throughput</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-center text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Get Started with Studio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-sm text-white">Is this an AI mastering tool?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No. Sonichecks is NOT a mastering tool. It does not alter, process, or equalize your audio. It is a deterministic quality-control tool that verifies whether your exported masters comply with delivery specifications.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-sm text-white">How are measurements calculated?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                We calculate true measurements using standard digital signal processing algorithms: ITU-R BS.1770-4 K-weighting filters for LUFS loudness, 4x polyphase sinc interpolation for True Peak (dBTP), and hard digital full-scale sample analysis for clipping.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-sm text-white">What happens to my uploaded audio files?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Privacy is strictly maintained. Uploaded audio files are stored in isolated temporary memory and automatically deleted immediately once the analysis calculations finish.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-sm text-white">What formats can I check?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                We support WAV (16/24/32-bit), AIFF, FLAC, and MP3 files up to 250 MB each.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="py-20 border-t border-slate-900 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Stop guessing. Deliver with confidence.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Check your audio tracks in seconds and catch loudness penalties, true-peak overs, and clipping before release.
          </p>
          <div className="pt-2">
            <Link
              href="/check"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              <span>Check My Audio Now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
