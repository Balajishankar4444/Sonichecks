import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ShieldCheck, Volume2, Sliders, Layers, CheckCircle2, AlertTriangle, ArrowRight, FileAudio, Activity, Cpu } from 'lucide-react';
import { getBreadcrumbSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'What Is Audio Quality Control? Technical Guide & Industry Standards | Sonichecks',
  description: 'Comprehensive technical guide to Audio Quality Control (QC): LUFS loudness, True Peak dBTP, digital clipping, WAV specifications, and pre-delivery validation.',
  alternates: {
    canonical: '/guide',
  },
  openGraph: {
    title: 'What Is Audio Quality Control? Technical Guide & Industry Standards | Sonichecks',
    description: 'Learn what audio QC measures, why LUFS and True Peak matter, and how to prevent digital master delivery rejections.',
  },
};

export default function AudioQcGuidePage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Technical Guide', url: '/guide' },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 sm:py-24 selection:bg-cyan-500/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-300">Technical Guide</span>
        </nav>

        {/* Header */}
        <header className="space-y-4 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>INDUSTRY STANDARDS &bull; TECHNICAL SPECIFICATION</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            What Is Audio Quality Control?
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Audio Quality Control (audio QC) is the methodical process of analyzing audio files against digital signal processing metrics, broadcast standards, and delivery specifications before release. While creative mixing and mastering evaluate aesthetic balance, tonal depth, and artistic intent, technical audio QC verifies that the exported digital file meets the strict mathematical constraints required for error-free playback, encoding, and distribution.
          </p>
        </header>

        {/* Main Guide Content */}
        <article className="space-y-12 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              <span>What Does an Audio Quality Check Measure?</span>
            </h2>
            <p>
              A professional audio quality check inspects several critical dimensions of a digital audio container:
            </p>

            <div className="grid gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-sm">&bull; Integrated Loudness (LUFS)</span>
                <span className="text-xs text-slate-400">The average perceived loudness of the entire program, calculated using standard ITU-R BS.1770-4 K-weighting filters with absolute and relative gating thresholds.</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-sm">&bull; True Peak (dBTP)</span>
                <span className="text-xs text-slate-400">The inter-sample peak level calculated through 4x polyphase oversampling interpolation, identifying analog reconstruction overshoots that exceed 0 dBFS.</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-sm">&bull; Digital Clipping</span>
                <span className="text-xs text-slate-400">The occurrence of consecutive full-scale digital samples hitting 0 dBFS, which generates flat-top square wave distortion.</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-sm">&bull; Silence Duration</span>
                <span className="text-xs text-slate-400">Measuring lead-in room tone to protect initial transients from buffer truncation and lead-out silence for clean playlist crossfades.</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-sm">&bull; Technical Format Integrity</span>
                <span className="text-xs text-slate-400">Confirming uncompressed PCM sample rates (44.1, 48, 96 kHz), 16/24/32-bit depth, channel topologies, and container metadata accuracy.</span>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 border-t border-slate-800 pt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Volume2 className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              <span>Why LUFS and True Peak Matter</span>
            </h2>
            <p>
              Digital streaming platforms apply automated loudness normalization to deliver a consistent volume experience to listeners. When a track is mastered significantly louder than the platform&apos;s reference target (such as -14.0 LUFS on Spotify or -16.0 LUFS on Apple Music), the platform&apos;s playback engine automatically turns the track down. This causes heavily limited, over-compressed masters to sound smaller and flatter than dynamically open tracks.
            </p>
            <p>
              Furthermore, lossy compression codecs (such as AAC, MP3, and Ogg Vorbis) reconstruct audio waveforms in ways that produce higher peak voltages than the original uncompressed PCM. If a master lacks adequate True Peak headroom (at least -1.0 dBTP to -2.0 dBTP), the encoded lossy file will clip upon playback in consumer headphones and car sound systems.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 border-t border-slate-800 pt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileAudio className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              <span>Why WAV Specifications Matter</span>
            </h2>
            <p>
              Uncompressed WAV files represent the definitive archival standard for audio distribution. However, sample rate mismatches—such as submitting a 44.1 kHz music file to a 48 kHz video broadcast ingest queue—trigger automatic resampling filters that degrade transient response. Verifying bit depths, channel configurations, and header metadata prevents ingestion rejections across distributors and aggregators.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 border-t border-slate-800 pt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Activity className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              <span>Why Check Before Audio Delivery?</span>
            </h2>
            <p>
              Finding a technical defect after an audio file has been submitted to a client, distributor, or streaming platform causes release delays, expensive re-deliveries, and reputational damage. Running an automated audio QC check with Sonichecks provides an instant, mathematically verifiable assessment of your files—ensuring that every master you deliver passes technical requirements on the first attempt.
            </p>
          </section>
        </article>

        {/* CTA Card */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-10 text-center space-y-6 shadow-2xl shadow-cyan-950/50">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Ready to inspect your masters?</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run an automated deterministic QC audit on your WAV, MP3, FLAC, or AIFF tracks before delivery.
            </p>
          </div>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-xl shadow-cyan-500/25 transition-all"
          >
            <span>Open Audio QC Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
