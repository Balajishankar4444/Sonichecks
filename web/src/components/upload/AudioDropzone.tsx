'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { MAX_FILE_SIZE_MB, SUPPORTED_EXTENSIONS, MAX_BATCH_SIZE } from '@/config/batch';

interface AudioDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  currentCount?: number;
  maxBatchSize?: number;
}

export default function AudioDropzone({ onFilesSelected, disabled, currentCount = 0, maxBatchSize = MAX_BATCH_SIZE }: AudioDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveMaxBatch = maxBatchSize;

  const validateAndAddFiles = (incomingList: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    const incomingArray = Array.from(incomingList);
    const remainingSlots = effectiveMaxBatch - currentCount;

    if (remainingSlots <= 0) {
      setErrorMsg(`Batch limit of ${effectiveMaxBatch} files reached. Please remove files or analyze the current batch.`);
      return;
    }

    const filesToConsider = incomingArray.slice(0, remainingSlots);
    if (incomingArray.length > remainingSlots) {
      setErrorMsg(`Maximum ${effectiveMaxBatch} files per batch. Added ${remainingSlots} files, skipped ${incomingArray.length - remainingSlots}.`);
    }

    filesToConsider.forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const sizeMb = file.size / (1024 * 1024);

      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        invalidNames.push(`${file.name} (unsupported format)`);
      } else if (sizeMb > MAX_FILE_SIZE_MB) {
        invalidNames.push(`${file.name} (exceeds ${MAX_FILE_SIZE_MB}MB limit)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidNames.length > 0 && !errorMsg) {
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
              or <span className="text-cyan-400 underline underline-offset-4 decoration-cyan-500/40 font-medium">browse files</span> from your computer (select multiple)
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
              up to {MAX_FILE_SIZE_MB}MB per file &bull; up to {effectiveMaxBatch} files per batch
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
