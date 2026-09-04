'use client';

import React, { useState } from 'react';
import { X, Plus, Save, Upload, Download, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { QCProfile } from '@/types/qc';
import { saveCustomProfile, exportCustomProfilesJson, importCustomProfilesJson } from '@/lib/storage/custom-profiles';

interface CustomProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated?: (profile: QCProfile) => void;
  editingProfile?: QCProfile | null;
}

export default function CustomProfileModal({
  isOpen,
  onClose,
  onProfileCreated,
  editingProfile
}: CustomProfileModalProps) {
  const [name, setName] = useState(editingProfile?.name || '');
  const [platform, setPlatform] = useState(editingProfile?.platform || 'Custom Studio Delivery');
  const [category, setCategory] = useState<any>(editingProfile?.category || 'Custom');
  const [version, setVersion] = useState(editingProfile?.version || '1.0');
  const [description, setDescription] = useState(editingProfile?.description || '');
  
  // Rules
  const [minLufs, setMinLufs] = useState<string>(editingProfile?.rules.min_lufs !== undefined ? String(editingProfile.rules.min_lufs) : '-16.0');
  const [maxLufs, setMaxLufs] = useState<string>(editingProfile?.rules.max_lufs !== undefined ? String(editingProfile.rules.max_lufs) : '-14.0');
  const [maxTruePeak, setMaxTruePeak] = useState<string>(editingProfile?.rules.max_true_peak_dbtp !== undefined ? String(editingProfile.rules.max_true_peak_dbtp) : '-1.0');
  const [allowClipping, setAllowClipping] = useState<boolean>(editingProfile?.rules.allow_clipping ?? false);
  const [sampleRates, setSampleRates] = useState<string>('44100, 48000');
  const [bitDepths, setBitDepths] = useState<string>('16, 24');
  const [minLeadSilence, setMinLeadSilence] = useState<string>('0.05');
  const [maxLeadSilence, setMaxLeadSilence] = useState<string>('1.5');
  const [minTailSilence, setMinTailSilence] = useState<string>('0.2');
  const [maxTailSilence, setMaxTailSilence] = useState<string>('4.0');

  const [importJson, setImportJson] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a profile name.');
      return;
    }

    const parsedSr = sampleRates.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    const parsedBd = bitDepths.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

    const newProfile: QCProfile = {
      profile_id: editingProfile?.profile_id || `custom_${Date.now()}`,
      name: name.trim(),
      platform: platform.trim() || 'Custom',
      category: 'Custom',
      version: version.trim() || '1.0',
      description: description.trim() || `Custom delivery specifications for ${name}.`,
      source_reference: 'User Defined Custom Profile',
      last_verified_date: new Date().toISOString().split('T')[0],
      is_custom: true,
      rules: {
        min_lufs: minLufs ? parseFloat(minLufs) : undefined,
        max_lufs: maxLufs ? parseFloat(maxLufs) : undefined,
        max_true_peak_dbtp: maxTruePeak ? parseFloat(maxTruePeak) : -1.0,
        allow_clipping: allowClipping,
        allowed_sample_rates: parsedSr.length > 0 ? parsedSr : undefined,
        allowed_bit_depths: parsedBd.length > 0 ? parsedBd : undefined,
        min_leading_silence_sec: minLeadSilence ? parseFloat(minLeadSilence) : undefined,
        max_leading_silence_sec: maxLeadSilence ? parseFloat(maxLeadSilence) : undefined,
        min_trailing_silence_sec: minTailSilence ? parseFloat(minTailSilence) : undefined,
        max_trailing_silence_sec: maxTailSilence ? parseFloat(maxTailSilence) : undefined
      }
    };

    saveCustomProfile(newProfile);
    if (onProfileCreated) onProfileCreated(newProfile);
    onClose();
  };

  const handleImportSubmit = () => {
    try {
      importCustomProfilesJson(importJson);
      setShowImportBox(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Custom Profile Builder</h3>
              <p className="text-xs text-slate-400">
                Build and version your own client &amp; studio delivery QC rules <span className="text-slate-500">(Saved locally in browser cache — export JSON to backup)</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Profile Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Podcast Deliveries"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Platform / Client</label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g. Warner / Private Client"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Min LUFS</label>
              <input
                type="number"
                step="0.1"
                value={minLufs}
                onChange={(e) => setMinLufs(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Max LUFS</label>
              <input
                type="number"
                step="0.1"
                value={maxLufs}
                onChange={(e) => setMaxLufs(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">True Peak Ceiling</label>
              <input
                type="number"
                step="0.1"
                value={maxTruePeak}
                onChange={(e) => setMaxTruePeak(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Allowed Sample Rates (comma-separated Hz)</label>
              <input
                type="text"
                value={sampleRates}
                onChange={(e) => setSampleRates(e.target.value)}
                placeholder="44100, 48000, 96000"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Allowed Bit Depths</label>
              <input
                type="text"
                value={bitDepths}
                onChange={(e) => setBitDepths(e.target.value)}
                placeholder="16, 24"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Min Lead Silence (s)</label>
              <input
                type="number"
                step="0.05"
                value={minLeadSilence}
                onChange={(e) => setMinLeadSilence(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Max Lead Silence (s)</label>
              <input
                type="number"
                step="0.05"
                value={maxLeadSilence}
                onChange={(e) => setMaxLeadSilence(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Min Tail Silence (s)</label>
              <input
                type="number"
                step="0.05"
                value={minTailSilence}
                onChange={(e) => setMinTailSilence(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Max Tail Silence (s)</label>
              <input
                type="number"
                step="0.05"
                value={maxTailSilence}
                onChange={(e) => setMaxTailSilence(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowImportBox(!showImportBox)}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Import / Export JSON</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>

        {showImportBox && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Import Custom Profiles (JSON)</span>
              <button
                type="button"
                onClick={() => {
                  const json = exportCustomProfilesJson();
                  navigator.clipboard.writeText(json);
                  alert('Custom profiles JSON copied to clipboard!');
                }}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Copy Current Profiles JSON</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste custom profiles JSON array here..."
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleImportSubmit}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
            >
              Import JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
