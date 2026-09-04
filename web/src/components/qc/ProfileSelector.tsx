'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronDown, 
  ExternalLink, 
  Calendar, 
  Layers, 
  Sparkles,
  Info,
  Plus
} from 'lucide-react';
import { QCProfile } from '@/types/qc';
import { VERIFIED_DELIVERY_PROFILES, PROFILE_CATEGORIES, ProfileCategory } from '@/config/delivery-standards';
import { ProductTier } from '@/config/tiers';

interface ProfileSelectorProps {
  selectedProfile: QCProfile;
  onSelectProfile: (profile: QCProfile) => void;
  customProfiles?: QCProfile[];
  onOpenCustomBuilder?: () => void;
  userTier?: ProductTier;
  onGatedAction?: (featureName: string, description: string, requiredTier: ProductTier) => void;
}

export default function ProfileSelector({
  selectedProfile,
  onSelectProfile,
  customProfiles = [],
  onOpenCustomBuilder,
  userTier = 'PRO',
  onGatedAction
}: ProfileSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<ProfileCategory>('All');
  const [isOpen, setIsOpen] = useState(false);

  const isFree = userTier === 'FREE';
  const allProfiles = [...VERIFIED_DELIVERY_PROFILES, ...customProfiles];

  const filteredProfiles = activeCategory === 'All' 
    ? allProfiles 
    : activeCategory === 'Custom'
    ? customProfiles
    : allProfiles.filter(p => p.category === activeCategory);

  const handleProfileClick = (p: QCProfile) => {
    const isBasicProfile = p.profile_id === 'standard' || p.profile_id === 'spotify';
    if (isFree && !isBasicProfile) {
      if (onGatedAction) {
        onGatedAction(
          `${p.name} Profile`,
          `Access to ${p.name} and the full 11+ delivery standards library is available on Pro and Studio plans.`,
          'PRO'
        );
      }
      return;
    }
    onSelectProfile(p);
    setIsOpen(false);
  };

  const handleCustomBuilderClick = () => {
    if (isFree && onGatedAction) {
      onGatedAction(
        'Custom Delivery Profiles',
        'Create, version, import, and export custom delivery profiles tailored to your studio standards on Pro and Studio plans.',
        'PRO'
      );
      return;
    }
    if (onOpenCustomBuilder) {
      onOpenCustomBuilder();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
      {/* Current Active Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              Active Profile &bull; v{selectedProfile.version}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {selectedProfile.platform}
            </span>
          </div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span>{selectedProfile.name}</span>
          </h4>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {selectedProfile.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Change Standard</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {onOpenCustomBuilder && (
            <button
              type="button"
              onClick={handleCustomBuilderClick}
              className="px-3 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Create Custom Profile"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Custom Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Spec Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500">Integrated LUFS Target</div>
          <div className="font-mono font-bold text-cyan-300 mt-0.5">
            {selectedProfile.rules.min_lufs !== undefined && selectedProfile.rules.max_lufs !== undefined
              ? `${selectedProfile.rules.min_lufs} to ${selectedProfile.rules.max_lufs} LUFS`
              : 'Unrestricted'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500">True Peak Ceiling</div>
          <div className="font-mono font-bold text-cyan-300 mt-0.5">
            {selectedProfile.rules.max_true_peak_dbtp !== undefined 
              ? `≤ ${selectedProfile.rules.max_true_peak_dbtp} dBTP` 
              : '≤ -1.0 dBTP'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500">Sample Rates</div>
          <div className="font-mono font-bold text-slate-200 mt-0.5">
            {selectedProfile.rules.allowed_sample_rates?.map(sr => `${sr / 1000}k`).join(', ') || 'Any PCM'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500">Bit Depths</div>
          <div className="font-mono font-bold text-slate-200 mt-0.5">
            {selectedProfile.rules.allowed_bit_depths?.map(b => `${b}b`).join(', ') || '16 / 24 / 32b'}
          </div>
        </div>
      </div>

      {/* Expandable Full Profile Library */}
      {isOpen && (
        <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/80">
            {PROFILE_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
                {cat === 'Custom' && customProfiles.length > 0 && ` (${customProfiles.length})`}
              </button>
            ))}
          </div>

          {/* Profile Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredProfiles.map(p => {
              const isCurrent = p.profile_id === selectedProfile.profile_id;
              const isBasicProfile = p.profile_id === 'standard' || p.profile_id === 'spotify';
              const isLocked = isFree && !isBasicProfile;

              return (
                <button
                  key={p.profile_id}
                  type="button"
                  onClick={() => handleProfileClick(p)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer group ${
                    isCurrent
                      ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/40 shadow-lg'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        {p.platform} &bull; v{p.version}
                      </span>
                      {p.is_custom ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Custom
                        </span>
                      ) : isLocked ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Pro
                        </span>
                      ) : null}
                    </div>
                    <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                      {p.name}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono font-bold text-slate-300">
                    <span className="text-cyan-400">
                      {p.rules.min_lufs !== undefined ? `${p.rules.min_lufs} to ${p.rules.max_lufs} LUFS` : 'Universal'}
                    </span>
                    <span>
                      {p.rules.max_true_peak_dbtp !== undefined ? `≤ ${p.rules.max_true_peak_dbtp} dBTP` : '≤ -1.0 dBTP'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
