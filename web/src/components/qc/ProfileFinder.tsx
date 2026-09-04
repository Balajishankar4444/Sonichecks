'use client';

import React, { useState } from 'react';
import { 
  Music, 
  Mic, 
  BookOpen, 
  Radio, 
  Tv, 
  Video, 
  Headphones, 
  Disc, 
  Sliders, 
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { QCProfile } from '@/types/qc';
import { VERIFIED_DELIVERY_PROFILES } from '@/config/delivery-standards';

import { ProductTier } from '@/config/tiers';

interface ProfileFinderProps {
  selectedProfileId: string;
  onSelectProfile: (profile: QCProfile) => void;
  customProfiles?: QCProfile[];
  userTier?: ProductTier;
  onGatedAction?: (featureName: string, description: string, requiredTier: ProductTier) => void;
}

interface DestinationOption {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  defaultProfileId: string;
  badge: string;
  isProOnly?: boolean;
}

const DESTINATIONS: DestinationOption[] = [
  {
    id: 'music_streaming',
    label: 'Music Streaming',
    sublabel: 'Spotify, Apple Music, Tidal, Deezer',
    icon: Music,
    defaultProfileId: 'spotify',
    badge: '-14 LUFS / -1.0 dBTP',
    isProOnly: false
  },
  {
    id: 'podcast',
    label: 'Podcast / Spoken Word',
    sublabel: 'Apple Podcasts, Spotify for Podcasters, RSS',
    icon: Mic,
    defaultProfileId: 'podcast_aes',
    badge: 'AES TD1004 (-16 LUFS)',
    isProOnly: true
  },
  {
    id: 'audiobook',
    label: 'Audiobook (ACX / Audible)',
    sublabel: 'Amazon ACX, Audible, Findaway',
    icon: BookOpen,
    defaultProfileId: 'acx_audiobook',
    badge: 'ACX Spec (-23 to -18 LUFS)',
    isProOnly: true
  },
  {
    id: 'broadcast_tv',
    label: 'Broadcast TV & Radio',
    sublabel: 'European EBU R128 or US ATSC A/85',
    icon: Radio,
    defaultProfileId: 'broadcast_ebu',
    badge: 'EBU R128 (-23 LUFS)',
    isProOnly: true
  },
  {
    id: 'youtube_video',
    label: 'YouTube / Web Video',
    sublabel: 'Video creators, Vimeo, Social Video',
    icon: Video,
    defaultProfileId: 'youtube',
    badge: '-14 LUFS / 48kHz',
    isProOnly: true
  },
  {
    id: 'club_dj',
    label: 'Club / DJ Master',
    sublabel: 'Beatport, SoundCloud, Club Sound Systems',
    icon: Disc,
    defaultProfileId: 'club_loud',
    badge: 'High Energy (-9 to -6 LUFS)',
    isProOnly: true
  },
  {
    id: 'standard_master',
    label: 'Standard Master',
    sublabel: 'Direct client delivery & archival WAV',
    icon: Headphones,
    defaultProfileId: 'standard',
    badge: 'Universal Delivery',
    isProOnly: false
  }
];

export default function ProfileFinder({
  selectedProfileId,
  onSelectProfile,
  customProfiles = [],
  userTier = 'PRO',
  onGatedAction
}: ProfileFinderProps) {
  const [selectedDestId, setSelectedDestId] = useState<string>(() => {
    const matched = DESTINATIONS.find(d => d.defaultProfileId === selectedProfileId);
    return matched ? matched.id : 'standard_master';
  });

  const isFree = userTier === 'FREE';

  const handleDestinationClick = (dest: DestinationOption) => {
    if (isFree && dest.isProOnly) {
      if (onGatedAction) {
        onGatedAction(
          `${dest.label} Profile`,
          `Targeted delivery specifications for ${dest.label} (${dest.badge}) are available on Pro and Studio plans.`,
          'PRO'
        );
      }
      return;
    }

    setSelectedDestId(dest.id);
    const target = [...VERIFIED_DELIVERY_PROFILES, ...customProfiles].find(
      p => p.profile_id === dest.defaultProfileId
    );
    if (target) {
      onSelectProfile(target);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Delivery Standards Finder
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white mt-1">
            Where are you delivering this audio?
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Select destination to automatically apply verified technical QC thresholds.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {DESTINATIONS.map((dest) => {
          const Icon = dest.icon;
          const isSelected = selectedProfileId === dest.defaultProfileId || selectedDestId === dest.id;

          return (
            <button
              key={dest.id}
              type="button"
              onClick={() => handleDestinationClick(dest)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group ${
                isSelected
                  ? 'border-cyan-400/80 bg-cyan-950/30 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                  : 'border-slate-800/90 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg border ${
                  isSelected 
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' 
                    : 'border-slate-800 bg-slate-950 text-slate-400 group-hover:text-slate-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                ) : isFree && dest.isProOnly ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Pro
                  </span>
                ) : null}
              </div>

              <div>
                <div className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {dest.label}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {dest.sublabel}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 font-mono text-[9.5px] font-bold text-cyan-400 truncate">
                {dest.badge}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
