'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ShieldCheck, User, LogOut, LogIn, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, openAuthModal, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Check Audio', href: '/check' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25 group-hover:scale-105 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <Activity className="w-5 h-5 text-white stroke-[2.5] group-hover:rotate-6 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors duration-200">
                Sonichecks
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:border-cyan-400/40 transition-colors">
                QC
              </span>
            </div>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/50">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-500/15 shadow-sm shadow-cyan-950/50 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth & Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-xs text-slate-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-cyan-950/20"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-[10px]">
                  {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[120px] truncate font-medium">{user.email?.split('@')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs transition-all duration-200 animate-page-enter backdrop-blur-lg"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-[11px] text-slate-400">Signed in as</p>
                    <p className="font-bold text-white truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
                  >
                    Dashboard &amp; Quota
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
                  >
                    Manage Plan
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-rose-400 hover:bg-rose-950/20 flex items-center gap-2 border-t border-slate-800 mt-1 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}

          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Check Audio</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
