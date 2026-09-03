'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Clock, 
  FolderKanban, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  FileDown, 
  FileSpreadsheet, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Lock,
  ArrowRight,
  Folder,
  LogIn
} from 'lucide-react';
import { getSavedHistory, getUsageState, updatePlan, UsageState } from '@/lib/storage';
import { BatchQCResult, QCStatus } from '@/types/qc';
import { ProductTier, TIER_CONFIGS, getTierConfig } from '@/config/tiers';
import UpgradePromptModal, { UpgradePromptState } from '@/components/common/UpgradePromptModal';
import TierBadgeSelector from '@/components/common/TierBadgeSelector';
import { downloadPdfReport, downloadCsvReport } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, openAuthModal, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<BatchQCResult[]>([]);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string; client: string; fileCount: number; date: string }[]>([
    { id: 'proj-1', name: 'Summer EP Master 2026', client: 'Midnight Records', fileCount: 4, date: '2026-09-02' },
    { id: 'proj-2', name: 'Podcast Season 3 Delivery', client: 'AudioSphere Media', fileCount: 12, date: '2026-08-28' },
  ]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null);

  useEffect(() => {
    setHistory(getSavedHistory(user?.email || undefined));
    setUsage(getUsageState(user?.email || undefined));
  }, [user]);

  const userTier: ProductTier = (usage?.plan?.toUpperCase() as ProductTier) || 'FREE';
  const tierConfig = getTierConfig(userTier);

  const triggerGate = (featureName: string, description: string, requiredTier: ProductTier = 'PRO') => {
    setUpgradePrompt({
      isOpen: true,
      featureName,
      description,
      requiredTier
    });
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setProjects([
      {
        id: `proj-${Date.now()}`,
        name: newProjectName,
        client: newClientName || 'Direct Client',
        fileCount: 0,
        date: new Date().toISOString().slice(0, 10)
      },
      ...projects
    ]);
    setNewProjectName('');
    setNewClientName('');
    setShowNewProjectModal(false);
  };

  const usagePercent = usage ? Math.min(100, Math.round((usage.filesChecked / tierConfig.monthlyFileLimit) * 100)) : 0;

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Sign In to View Dashboard</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your monthly checks quota, subscription tier, and inspection certificates are securely linked to your account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal()}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Create Free Account</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Quality Control Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Account: <span className="text-cyan-300 font-semibold">{user?.email || 'Guest'}</span> &bull; Track file allowances and past runs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TierBadgeSelector />
            <Link
              href="/check"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>New QC Inspection</span>
            </Link>
          </div>
        </div>

        {/* Tier & Usage Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Monthly Allowance */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly File Usage</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {usage?.filesChecked || 0} / {tierConfig.monthlyFileLimit} checks
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
              <span>Resets on 1st of each month</span>
              {userTier === 'FREE' && (
                <Link href="/pricing" className="text-cyan-400 hover:underline font-medium">
                  Upgrade (100 checks)
                </Link>
              )}
            </div>
          </div>

          {/* Current Tier Details */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Plan</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                userTier === 'STUDIO' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                userTier === 'PRO' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {tierConfig.name} &bull; €{tierConfig.priceEur}/mo
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tierConfig.description}
            </p>
            <div className="pt-1">
              <Link href="/pricing" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
                <span>View all features &amp; tiers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Batch Capacity */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch Capacity</span>
            <div className="text-2xl font-bold text-white">
              {tierConfig.maxBatchSize === 1 ? 'Single File Only' : `Up to ${tierConfig.maxBatchSize} files / batch`}
            </div>
            <p className="text-xs text-slate-400">
              {userTier === 'STUDIO' ? 'High-capacity 200-track studio batches with priority processing.' :
               userTier === 'PRO' ? '50-file bulk albums with full consistency analysis.' :
               'Free tier is limited to 1 file at a time. Upgrade to Pro for 50-file batches.'}
            </p>
          </div>
        </div>

        {/* Studio Projects Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FolderKanban className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Studio Projects &amp; Client Runs</h2>
            </div>

            {userTier === 'STUDIO' ? (
              <button
                type="button"
                onClick={() => setShowNewProjectModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => triggerGate('Studio Projects & Organization', 'Organize your QC runs by client, album, or series with unified project reports on the Studio plan.', 'STUDIO')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlock Projects (Studio)</span>
              </button>
            )}
          </div>

          {userTier === 'STUDIO' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-400 font-semibold">{p.client}</span>
                    <span className="text-[10px] text-slate-500">{p.date}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                  <p className="text-xs text-slate-400">{p.fileCount} tracks inspected</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
              <p className="text-xs text-slate-400">
                Organize client deliverables and album releases into unified Projects with Studio plan (€14.99/mo).
              </p>
            </div>
          )}
        </div>

        {/* QC History Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Recent QC Inspections</h2>
            </div>
          </div>

          {userTier === 'FREE' ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">QC History is available on Pro</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Upgrade to Pro to automatically preserve past inspection records, re-download certificates, and track loudness trends over time.
              </p>
              <button
                type="button"
                onClick={() => triggerGate('Inspection History', 'Saved QC history and instant report downloads are available on Pro.', 'PRO')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 transition-all cursor-pointer"
              >
                <span>Unlock History on Pro (€4.99/mo)</span>
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
              No recent inspections found. Run your first check on the <Link href="/check" className="text-cyan-400 underline">QC Workspace</Link>.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((batch) => (
                <div
                  key={batch.batch_id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      batch.overall_status === 'PASS' ? 'bg-emerald-400' :
                      batch.overall_status === 'WARNING' ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                    <div>
                      <h4 className="font-bold text-white">
                        {batch.files.length === 1 ? batch.files[0].filename : `${batch.files.length} Files Batch`}
                      </h4>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                        <span>Profile: {batch.profile_name}</span>
                        <span>&bull;</span>
                        <span>{new Date(batch.created_at).toLocaleDateString()}</span>
                        {batch.summary.avg_lufs && (
                          <>
                            <span>&bull;</span>
                            <span className="text-cyan-300 font-mono">{batch.summary.avg_lufs} LUFS</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => downloadPdfReport(batch, userTier)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
                      title="Download PDF certificate"
                    >
                      <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCsvReport(batch, userTier)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                      title="Download CSV report"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal (Studio) */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Create New Studio Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300">Project / Album Title</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Master Delivery 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300">Client / Label</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Warner Music / Independent"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Gating Modal */}
      <UpgradePromptModal
        prompt={upgradePrompt}
        onClose={() => setUpgradePrompt(null)}
      />
    </div>
  );
}
