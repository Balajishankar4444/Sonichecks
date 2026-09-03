import Link from 'next/link';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';

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
              Automated deterministic audio quality control for musicians, producers, podcasters, voiceover artists, and studios.
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
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition-colors">QC Dashboard</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing &amp; Plans</Link></li>
              <li><Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact &amp; Support</Link></li>
            </ul>
          </div>

          {/* Standards & Guides */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">QC Standards &amp; Guides</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/guide" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors flex items-center gap-1">Audio QC Technical Guide &rarr;</Link></li>
              <li><Link href="/loudness-checker" className="hover:text-cyan-400 transition-colors">LUFS Loudness Specs</Link></li>
              <li><Link href="/wav-checker" className="hover:text-cyan-400 transition-colors">True Peak &amp; Sample Peak</Link></li>
              <li><Link href="/audio-file-validator" className="hover:text-cyan-400 transition-colors">Digital Clipping Detection</Link></li>
              <li><Link href="/audio-delivery-checker" className="hover:text-cyan-400 transition-colors">ACX &amp; Streaming Standards</Link></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Legal &amp; Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refunds" className="hover:text-cyan-400 transition-colors">Refund &amp; Cancellation</Link></li>
              <li><Link href="/contact" className="hover:text-cyan-400 transition-colors">Support Inquiries</Link></li>
            </ul>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              Ephemeral security: Uploaded audio is permanently purged immediately following analysis.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Sonichecks Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/refunds" className="hover:text-slate-300 transition-colors">Refunds</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
