import Link from 'next/link';
import { Activity, ShieldCheck, FileCheck, AudioWaveform, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg text-white">Sonichecks</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automated deterministic audio quality control for musicians, podcasters, voiceover artists, and studios.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>ITU-R BS.1770-4 &bull; EBU R128 Compliant</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/check" className="hover:text-cyan-400 transition-colors">Audio QC Workspace</Link></li>
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Recent Checks Dashboard</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing & Plans</Link></li>
              <li><Link href="/audio-quality-checker" className="hover:text-cyan-400 transition-colors">Supported Formats</Link></li>
            </ul>
          </div>

          {/* Standards & Guides */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">QC Standards</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/loudness-checker" className="hover:text-cyan-400 transition-colors">LUFS Loudness Specs</Link></li>
              <li><Link href="/wav-checker" className="hover:text-cyan-400 transition-colors">True Peak & Sample Peak</Link></li>
              <li><Link href="/audio-file-validator" className="hover:text-cyan-400 transition-colors">Digital Clipping Detection</Link></li>
              <li><Link href="/audio-delivery-checker" className="hover:text-cyan-400 transition-colors">ACX & Streaming Standards</Link></li>
            </ul>
          </div>

          {/* Compliance Guarantee */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">QC Engine Guarantee</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sonichecks uses pure mathematical DSP calculations (SoundFile, NumPy, pyloudnorm, FFmpeg). No generative hallucinations.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              Ephemeral security: Uploaded audio files are automatically purged immediately following analysis.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Sonichecks Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Audio Quality Control, Made Simple.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
