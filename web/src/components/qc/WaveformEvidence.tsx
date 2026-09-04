'use client';

import React from 'react';
import { Activity, Clock, Play, AlertCircle } from 'lucide-react';
import { FileQCResult } from '@/types/qc';
import { ProductTier } from '@/config/tiers';
import { Lock } from 'lucide-react';

interface WaveformEvidenceProps {
  result: FileQCResult;
  onJumpToTimestamp?: (timestampSec: number) => void;
  activeTimestamp?: number | null;
  userTier?: ProductTier;
  onGatedAction?: (featureName: string, description: string, requiredTier: ProductTier) => void;
}

export default function WaveformEvidence({
  result,
  onJumpToTimestamp,
  activeTimestamp,
  userTier = 'PRO',
  onGatedAction
}: WaveformEvidenceProps) {
  const isFree = userTier === 'FREE';
  const duration = result.file_info?.duration_seconds || 1.0;
  const rawEnvelope = result.waveform_peaks || [];

  // Fallback synthetic envelope if not provided
  const envelope = rawEnvelope.length > 0 
    ? rawEnvelope 
    : Array.from({ length: 80 }).map((_, i) => 0.2 + 0.6 * Math.sin((i / 80) * Math.PI));

  // Collect marker points
  const markers: { 
    id: string; 
    name: string; 
    timestampSec: number; 
    type: 'FAIL' | 'WARNING' | 'PEAK' | 'SILENCE'; 
    color: string;
    label: string;
  }[] = [];

  // True peak marker
  if (result.peaks?.true_peak_timestamp_sec !== undefined && result.peaks.true_peak_timestamp_sec !== null) {
    const isFail = result.peaks.true_peak_dbtp > -1.0;
    markers.push({
      id: 'tp_marker',
      name: 'Max True Peak',
      timestampSec: result.peaks.true_peak_timestamp_sec,
      type: isFail ? 'FAIL' : 'PEAK',
      color: isFail ? '#ef4444' : '#0ea5e9',
      label: `${result.peaks.true_peak_dbtp} dBTP`
    });
  }

  // Clipping markers
  if (result.clipping?.clipping_timestamps_sec) {
    result.clipping.clipping_timestamps_sec.forEach((t, idx) => {
      markers.push({
        id: `clip_${idx}`,
        name: `Clipping Event #${idx + 1}`,
        timestampSec: t,
        type: 'FAIL',
        color: '#ef4444',
        label: 'Clip'
      });
    });
  }

  // Short term loudness max
  if (result.loudness?.short_term_max_timestamp_sec !== undefined && result.loudness.short_term_max_timestamp_sec !== null) {
    markers.push({
      id: 'st_loudness',
      name: 'Max Short-Term Loudness',
      timestampSec: result.loudness.short_term_max_timestamp_sec,
      type: 'WARNING',
      color: '#f59e0b',
      label: `${result.loudness.short_term_max_lufs?.toFixed(1)} LUFS`
    });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Waveform Evidence &amp; Finding Markers
          </h4>
        </div>
        <span className="font-mono text-xs text-slate-400">
          Duration: {new Date(duration * 1000).toISOString().substr(14, 8)}
        </span>
      </div>

      {/* Interactive Waveform Canvas / SVG Container */}
      <div className="relative rounded-xl border border-slate-800 bg-[#06080d] p-4 h-32 flex flex-col justify-end overflow-hidden group">
        {/* Ambient Grid Lines */}
        <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Center zero line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-800/80 pointer-events-none" />

        {/* Waveform Bars */}
        <div className="relative z-0 flex items-center justify-between h-full gap-[1.5px] w-full">
          {envelope.map((val, idx) => {
            const heightPercent = Math.min(100, Math.max(8, val * 100));
            const barTime = (idx / envelope.length) * duration;
            const hasNearbyMarker = markers.some(m => Math.abs(m.timestampSec - barTime) < (duration / envelope.length) * 1.5);

            return (
              <div
                key={idx}
                className="h-full flex items-center flex-1"
                onClick={() => onJumpToTimestamp && onJumpToTimestamp(barTime)}
                title={`Time: ${new Date(barTime * 1000).toISOString().substr(14, 8)} (Peak: ${(val).toFixed(2)})`}
              >
                <div
                  className={`w-full rounded-full transition-all duration-150 ${
                    hasNearbyMarker 
                      ? 'bg-rose-400 shadow-sm shadow-rose-500/50' 
                      : 'bg-cyan-400/60 group-hover:bg-cyan-400/80'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Marker Overlays */}
        {markers.map((m) => {
          const leftPercent = Math.max(0, Math.min(100, (m.timestampSec / duration) * 100));
          const isActive = activeTimestamp != null && Math.abs(activeTimestamp - m.timestampSec) < 0.5;

          const handleMarkerClick = () => {
            if (isFree && onGatedAction) {
              onGatedAction(
                'Finding Timestamps & Audition',
                'Interactive timeline markers and finding auditioning are available on Pro and Studio plans.',
                'PRO'
              );
              return;
            }
            if (onJumpToTimestamp) {
              onJumpToTimestamp(m.timestampSec);
            }
          };

          return (
            <div
              key={m.id}
              onClick={handleMarkerClick}
              style={{ left: `${leftPercent}%` }}
              className={`absolute top-0 bottom-0 -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer group/marker ${
                isActive ? 'scale-110' : ''
              }`}
            >
              {/* Flag Badge */}
              <div 
                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black text-slate-950 shadow-lg tracking-wider"
                style={{ backgroundColor: m.color }}
              >
                {m.label}
              </div>

              {/* Marker Line */}
              <div 
                className="w-[1.5px] flex-1 my-0.5 opacity-80 group-hover/marker:opacity-100" 
                style={{ backgroundColor: m.color }}
              />

              <div 
                className="w-2 h-2 rounded-full ring-2 ring-slate-950" 
                style={{ backgroundColor: m.color }}
              />
            </div>
          );
        })}
      </div>

      {/* Marker Legend & Quick Jump Bar */}
      {markers.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Detected Events ({markers.length}):
          </span>
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onJumpToTimestamp && onJumpToTimestamp(m.timestampSec)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="font-medium">{m.name}</span>
              <span className="font-mono text-cyan-400 text-[10px]">
                {new Date(m.timestampSec * 1000).toISOString().substr(14, 8)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>No severe peak overshoots or clipping anomalies detected along timeline.</span>
        </div>
      )}
    </div>
  );
}
