'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Music, FileAudio, AlertCircle } from 'lucide-react';

interface AudioDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const SUPPORTED_EXTS = ['.wav', '.aiff', '.aif', '.flac', '.mp3', '.ogg', '.m4a'];
const MAX_FILE_SIZE_MB = 250;

export default function AudioDropzone({ onFilesSelected, disabled }: AudioDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (incomingList: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    Array.from(incomingList).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const sizeMb = file.size / (1024 * 1024);

      if (!SUPPORTED_EXTS.includes(ext)) {
        invalidNames.push(`${file.name} (unsupported format)`);
      } else if (sizeMb > MAX_FILE_SIZE_MB) {
        invalidNames.push(`${file.name} (exceeds ${MAX_FILE_SIZE_MB}MB limit)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidNames.length > 0) {
      setErrorMsg(`Skipped ${invalidNames.length} invalid file(s): ${invalidNames.slice(0, 2).join(', ')}${invalidNames.length > 2 ? '...' : ''}`);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      // Reset input value so re-selecting the same file works
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".wav,.aiff,.aif,.flac,.mp3,.ogg,.m4a,audio/*"
          className="hidden"
          disabled={disabled}
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
            <UploadCloud className="w-8 h-8 stroke-[1.75]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Drop your audio files here
            </h3>
            <p className="text-sm text-slate-400">
              or <span className="text-cyan-400 underline underline-offset-4 decoration-cyan-500/40 font-medium">browse files</span> from your computer
            </p>
          </div>

          {/* Supported format tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['WAV', 'AIFF', 'FLAC', 'MP3'].map((fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700/80"
              >
                {fmt}
              </span>
            ))}
            <span className="text-xs text-slate-400 self-center pl-1">
              up to 250 MB per file &bull; multi-track batches supported
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
