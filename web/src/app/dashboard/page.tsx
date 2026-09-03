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
  LogIn, 
  PartyPopper, 
  RefreshCw, 
  Zap,
  Info
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
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [projects, setProjects] = useState<{ id: string; name: string; client: string; fileCount: number; date: string }[]>([
    { id: 'proj-1', name: 'Summer EP Master 2026', client: 'Midnight Records', fileCount: 4, date: '2026-09-02' },
    { id: 'proj-2', name: 'Podcast Season 3 Delivery', client: 'AudioSphere Media', fileCount: 12, date: '2026-08-28' },
  ]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null);

  const refreshState = (overrideEmail?: string) => {
    const targetEmail = overrideEmail !== undefined ? overrideEmail : (user?.email || undefined);
    setHistory(getSavedHistory(targetEmail));
    setUsage(getUsageState(targetEmail));
  };

  const syncSubscriptionWithServer = async (emailToSync?: string, showNotification: boolean = false) => {
    const targetEmail = emailToSync || user?.email;
    if (!targetEmail) return;

    setIsSyncing(true);
    try {
      const res = await fetch(`/api/subscription/sync?email=${encodeURIComponent(targetEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.plan && (data.plan === 'pro' || data.plan === 'studio')) {
          updatePlan(data.plan, targetEmail);
          refreshState(targetEmail);
          if (showNotification) {
            setSyncMessage(`🎉 Verified: ${data.plan.toUpperCase()} plan is active for ${targetEmail}!`);
          }
        } else if (showNotification) {
          setSyncMessage(`Plan is up to date (${data.plan?.toUpperCase() || 'FREE'}).`);
        }
      }
    } catch (err) {
      console.warn('Subscription sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 1. Initial load for the authenticated user
    refreshState(user?.email || undefined);

    // 2. Check URL parameters for Creem payment return (only on first-time return from checkout)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const planParam = urlParams.get('plan')?.toLowerCase();

      if (paymentStatus === 'success' && (planParam === 'pro' || planParam === 'studio')) {
        updatePlan(planParam as 'pro' | 'studio', user?.email || undefined);
        setSyncMessage(`🎉 Payment Verified! Your ${planParam.toUpperCase()} subscription is now active.`);
        refreshState(user?.email || undefined);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // 3. Silent background auto-sync from server (no banner shown)
    if (user?.email) {
      syncSubscriptionWithServer(user.email, false);
    }

    // 4. Listen for global plan updates
    const handlePlanUpdate = () => refreshState(user?.email || undefined);
    window.addEventListener('sonichecks_plan_updated', handlePlanUpdate);
    window.addEventListener('storage', handlePlanUpdate);

    return () => {
      window.removeEventListener('sonichecks_plan_updated', handlePlanUpdate);
      window.removeEventListener('storage', handlePlanUpdate);
    };
  }, [user?.email]);

  const handleManualSync = () => {
    if (user?.email) {
      syncSubscriptionWithServer(user.email, true);
    } else {
      refreshState();
    }
  };

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
        {/* Sync / Success Notification Banner */}
        {syncMessage && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-2 border-emerald-500/50 flex items-center justify-between gap-4 shadow-xl shadow-emerald-950/50 animate-fadeIn">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <PartyPopper className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {syncMessage}
                </h4>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  100 files/month quota, Batch QC matrix, and PDF inspection certificates are now unlocked.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSyncMessage(null)}
              className="text-emerald-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Quality Control Dashboard
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                userTier === 'STUDIO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                userTier === 'PRO' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {userTier}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Account: <span className="text-white font-medium">{user?.email || 'Guest User'}</span> &bull; Track file allowances and past runs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Sync subscription status from Creem payment gateway"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Plan'}</span>
            </button>

            {userTier === 'FREE' && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Upgrade to Pro (€4.99)</span>
              </Link>
            )}

            <Link
              href="/check"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New QC Inspection</span>
            </Link>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Monthly Checks Quota Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Monthly Allowance</span>
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono">
                {usage?.filesChecked ?? 0} <span className="text-sm font-normal text-slate-400">/ {tierConfig.monthlyFileLimit} files</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    usagePercent >= 100 ? 'bg-rose-500' : usagePercent > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {Math.max(0, tierConfig.monthlyFileLimit - (usage?.filesChecked ?? 0))} checks remaining in {usage?.month || 'current cycle'}.
            </p>
          </div>

          {/* Active Subscription Tier Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Subscription</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white capitalize">{tierConfig.name}</span>
                <span className="text-sm font-semibold text-slate-400">€{tierConfig.priceEur}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Batch size: up to {tierConfig.maxBatchSize} files &bull; {userTier === 'FREE' ? 'Single checks' : 'Full Batch Matrix'}
              </p>
            </div>
            {userTier === 'FREE' ? (
              <Link 
                href="/pricing" 
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
              >
                <span>Upgrade to Pro (€4.99)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Subscription Active</span>
              </span>
            )}
          </div>

          {/* QC Inspection Summary */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Saved History</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {history.length} <span className="text-sm font-normal text-slate-400">QC batches</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Total tracks inspected: {history.reduce((acc, b) => acc + (b.summary?.total_files || 0), 0)}
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              Retained in browser storage for instant retrieval and re-export.
            </p>
          </div>
        </div>

        {/* Local Device Storage Notice Banner */}
        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3 shadow-md">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white">Local Device Storage Notice:</span>
            <p className="text-slate-300">
              Inspection certificates and batch metrics are stored securely in this browser&apos;s local storage. Download your PDF Certificates or CSV spreadsheets to keep permanent records on your computer, as clearing browser cache or switching devices will reset local inspection history.
            </p>
          </div>
        </div>

        {/* History / Recent QC Batches Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Recent QC Inspections</span>
            </h2>
            {history.length > 0 && (
              <span className="text-xs text-slate-400">Showing last {history.length} batches</span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Inspection History Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Run your first audio QC analysis to see your batches, compliance status, and downloadable reports here.
                </p>
              </div>
              <Link
                href="/check"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <span>Start Audio QC</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((batch) => {
                const isPass = batch.overall_status === 'PASS';
                const isWarn = batch.overall_status === 'WARNING';

                return (
                  <div
                    key={batch.batch_id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
                          isPass ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          isWarn ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {isPass ? <CheckCircle2 className="w-3 h-3" /> : isWarn ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{batch.overall_status}</span>
                        </span>
                        <span className="text-sm font-bold text-white truncate">
                          {batch.profile_name || 'Standard Delivery'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span>{batch.summary?.total_files || 1} file{(batch.summary?.total_files || 1) > 1 ? 's' : ''}</span>
                        <span>&bull;</span>
                        <span>{new Date(batch.created_at).toLocaleDateString()}</span>
                        {batch.summary?.avg_lufs !== null && batch.summary?.avg_lufs !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span>Avg: <span className="font-mono text-cyan-300">{batch.summary.avg_lufs} LUFS</span></span>
                          </>
                        )}
                        {batch.summary?.highest_true_peak_dbtp !== null && batch.summary?.highest_true_peak_dbtp !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span>Peak: <span className="font-mono text-slate-200">{batch.summary.highest_true_peak_dbtp} dBTP</span></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (!tierConfig.allowPdfExport) {
                            triggerGate('PDF QC Certificate', 'Export cryptographic PDF inspection certificates with SHA-256 signatures for your clients.', 'PRO');
                            return;
                          }
                          downloadPdfReport(batch);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                        <span>PDF Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!tierConfig.allowCsvExport) {
                            triggerGate('CSV Matrix Export', 'Download structured CSV inspection reports and multi-track metadata spreadsheets.', 'PRO');
                            return;
                          }
                          downloadCsvReport(batch);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>CSV Matrix</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upgrade Prompt Modal */}
        <UpgradePromptModal
          prompt={upgradePrompt}
          onClose={() => setUpgradePrompt(null)}
        />
      </div>
    </div>
  );
}
