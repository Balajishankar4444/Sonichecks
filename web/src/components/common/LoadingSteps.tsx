'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, CircleDashed, Cpu, Waves } from 'lucide-react';

interface LoadingStepsProps {
  fileCount: number;
}

const STEPS = [
  { label: 'Decoding audio stream & inspecting metadata', duration: 800 },
  { label: 'Measuring ITU-R BS.1770-4 Integrated & Short-Term LUFS', duration: 1200 },
  { label: 'Calculating True Peak (dBTP) with 4x polyphase oversampling', duration: 1200 },
  { label: 'Scanning for hard digital clipping & sample ceiling hits', duration: 900 },
  { label: 'Analyzing head, tail, and excessive silence energy', duration: 700 },
  { label: 'Evaluating QC profile rules & formatting delivery report', duration: 800 }
];

export default function LoadingSteps({ fileCount }: LoadingStepsProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto p-8 rounded-2xl bg-slate-900/80 border border-cyan-500/20 shadow-2xl shadow-cyan-950/40 text-center space-y-6">
      {/* Animated Icon */}
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-75" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Waves className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-bold text-white tracking-tight">
          Inspecting {fileCount === 1 ? 'Audio File' : `${fileCount} Audio Files`}
        </h3>
        <p className="text-xs text-slate-400">
          Running deterministic signal processing calculations...
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-3 text-left pt-2">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                isDone
                  ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/30'
                  : isCurrent
                  ? 'text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
              ) : (
                <CircleDashed className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
