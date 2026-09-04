'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Clock, Activity, Square } from 'lucide-react';

interface FindingAuditionPlayerProps {
  audioFile?: File | null;
  targetTimestampSec: number;
  findingLabel: string;
  preRollSec?: number;
  postRollSec?: number;
  onClose?: () => void;
}

export default function FindingAuditionPlayer({
  audioFile,
  targetTimestampSec,
  findingLabel,
  preRollSec = 2.5,
  postRollSec = 2.5,
  onClose
}: FindingAuditionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentTime, setCurrentTime] = useState(targetTimestampSec);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const startRegion = Math.max(0, targetTimestampSec - preRollSec);
  const endRegion = targetTimestampSec + postRollSec;
  const regionDuration = endRegion - startRegion;

  // Load and decode file locally
  useEffect(() => {
    if (!audioFile) return;
    let isCancelled = false;

    async function loadAudio() {
      setIsLoading(true);
      setError(null);
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) throw new Error('Web Audio API not supported');
        
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }

        const arrayBuffer = await audioFile!.arrayBuffer();
        const decoded = await audioContextRef.current.decodeAudioData(arrayBuffer);
        if (!isCancelled) {
          audioBufferRef.current = decoded;
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Could not decode audio locally for audition.');
          setIsLoading(false);
        }
      }
    }

    loadAudio();

    return () => {
      isCancelled = true;
      stopPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [audioFile]);

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (_) {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  const startPlayback = async () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    stopPlayback();

    const ctx = audioContextRef.current;
    const src = ctx.createBufferSource();
    src.buffer = audioBufferRef.current;
    src.loop = isLooping;
    src.loopStart = startRegion;
    src.loopEnd = endRegion;

    src.connect(ctx.destination);
    src.start(0, startRegion);

    sourceNodeRef.current = src;
    startTimeRef.current = ctx.currentTime;
    setIsPlaying(true);

    const updateProgress = () => {
      if (!sourceNodeRef.current) return;
      const elapsed = (ctx.currentTime - startTimeRef.current) % regionDuration;
      setCurrentTime(startRegion + elapsed);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    };
    animFrameRef.current = requestAnimationFrame(updateProgress);

    src.onended = () => {
      if (!isLooping) {
        setIsPlaying(false);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      }
    };
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-2xl shadow-cyan-950/40 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Finding Audition &bull; Local On-Device Player
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {findingLabel}
            </h4>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 cursor-pointer"
          >
            &times; Close
          </button>
        )}
      </div>

      {error ? (
        <div className="text-xs text-rose-400 p-3 rounded-lg bg-rose-950/30 border border-rose-900/40">
          {error}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isLoading || !audioBufferRef.current}
              onClick={togglePlay}
              className="w-10 h-10 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLooping 
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300' 
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Loop Region</span>
            </button>
          </div>

          {/* Region Timeline */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-500">
              {new Date(startRegion * 1000).toISOString().substr(14, 8)}
            </span>
            <div className="relative w-32 sm:w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-cyan-400 transition-all duration-75"
                style={{
                  width: `${Math.max(0, Math.min(100, ((currentTime - startRegion) / regionDuration) * 100))}%`
                }}
              />
              {/* Target Marker Pin */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-rose-400 z-10"
                style={{
                  left: `${((targetTimestampSec - startRegion) / regionDuration) * 100}%`
                }}
              />
            </div>
            <span className="text-slate-500">
              {new Date(endRegion * 1000).toISOString().substr(14, 8)}
            </span>
          </div>

          {/* Exact Timestamp Pin */}
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Target Pin</span>
            <span className="font-mono text-xs font-bold text-rose-400">
              {new Date(targetTimestampSec * 1000).toISOString().substr(14, 8)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
