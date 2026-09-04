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
  Info,
  Sliders,
  FileText,
  FileCode2
} from 'lucide-react';
import { getSavedHistory, getUsageState, updatePlan, UsageState } from '@/lib/storage';
import { BatchQCResult, QCProfile, QCStatus } from '@/types/qc';
import { ProductTier, TIER_CONFIGS, getTierConfig } from '@/config/tiers';
import UpgradePromptModal, { UpgradePromptState } from '@/components/common/UpgradePromptModal';
import TierBadgeSelector from '@/components/common/TierBadgeSelector';
import { downloadPdfCertificate } from '@/lib/reports/pdf-export';
import { downloadCsvLocally } from '@/lib/reports/csv-export';
import { exportQcResultAsJson } from '@/lib/reports/json-export';
import { useAuth } from '@/context/AuthContext';
import { loadProjects, saveProject, deleteProject, ProjectItem } from '@/lib/storage/project-storage';
import { loadCustomProfiles, deleteCustomProfile } from '@/lib/storage/custom-profiles';
import CustomProfileModal from '@/components/qc/CustomProfileModal';

export default function DashboardPage() {
  const { user, openAuthModal, loading: authLoading, setUserPlan } = useAuth();
  const [history, setHistory] = useState<BatchQCResult[]>([]);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [customProfiles, setCustomProfiles] = useState<QCProfile[]>([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Project Creation Modal state
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Custom Profile Modal state
  const [showCustomProfileModal, setShowCustomProfileModal] = useState(false);

  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null);

  const refreshState = (overrideEmail?: string) => {
    const targetEmail = overrideEmail !== undefined ? overrideEmail : (user?.email || undefined);
    setHistory(getSavedHistory(targetEmail));
    setUsage(getUsageState(targetEmail));
    setProjects(loadProjects());
    setCustomProfiles(loadCustomProfiles());
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
          if (user && user.plan !== data.plan) {
            setUserPlan(data.plan);
          }
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
    refreshState(user?.email || undefined);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const planParam = urlParams.get('plan')?.toLowerCase();

      if (paymentStatus === 'success' && (planParam === 'pro' || planParam === 'studio')) {
        const verifiedPlan = planParam as 'pro' | 'studio';
        sessionStorage.setItem('sonichecks_pending_plan_sync', verifiedPlan);
        updatePlan(verifiedPlan, user?.email || undefined);
        setUserPlan(verifiedPlan);
        setSyncMessage(`🎉 Payment Verified! Your ${verifiedPlan.toUpperCase()} subscription is now active.`);
        refreshState(user?.email || undefined);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    if (user?.email) {
      const pendingPlan = typeof window !== 'undefined' ? (sessionStorage.getItem('sonichecks_pending_plan_sync') as 'pro' | 'studio' | null) : null;
      if (pendingPlan) {
        sessionStorage.removeItem('sonichecks_pending_plan_sync');
        fetch('/api/subscription/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, plan: pendingPlan })
        }).then(res => res.json()).then(data => {
          if (data.success && data.plan) {
            updatePlan(data.plan, user.email || undefined);
            setUserPlan(data.plan);
            refreshState(user.email || undefined);
          }
        }).catch(console.warn);
      } else {
        syncSubscriptionWithServer(user.email, false);
      }
    }

    const handlePlanUpdate = () => refreshState(user?.email || undefined);
    window.addEventListener('sonichecks_plan_updated', handlePlanUpdate);
    window.addEventListener('sonichecks_projects_updated', handlePlanUpdate);
    window.addEventListener('sonichecks_custom_profiles_updated', handlePlanUpdate);
    window.addEventListener('storage', handlePlanUpdate);

    return () => {
      window.removeEventListener('sonichecks_plan_updated', handlePlanUpdate);
      window.removeEventListener('sonichecks_projects_updated', handlePlanUpdate);
      window.removeEventListener('sonichecks_custom_profiles_updated', handlePlanUpdate);
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

    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      client: newClientName.trim() || 'Direct Client',
      created_at: new Date().toISOString(),
      files: []
    };

    saveProject(newProj);
    setNewProjectName('');
    setNewClientName('');
    setShowNewProjectModal(false);
    setProjects(loadProjects());
  };

  const handleDeleteProject = (projId: string) => {
    if (confirm('Delete this project record from local storage?')) {
      deleteProject(projId);
      setProjects(loadProjects());
    }
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
              Account: <span className="text-white font-medium">{user?.email || 'Guest User'}</span> &bull; Track file allowances, projects, and custom profiles.
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
                {user?.filesChecked ?? usage?.filesChecked ?? 0}{' '}
                <span className="text-sm font-normal text-slate-400">
                  / {userTier === 'STUDIO' || user?.plan === 'studio' || user?.monthlyAllowance === -1 ? 'Unlimited' : `${user?.monthlyAllowance ?? tierConfig.monthlyFileLimit} files`}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    userTier === 'STUDIO' || user?.plan === 'studio' || user?.monthlyAllowance === -1
                      ? 'bg-purple-400 w-full'
                      : usagePercent >= 100
                      ? 'bg-rose-500'
                      : usagePercent > 80
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: userTier === 'STUDIO' || user?.plan === 'studio' || user?.monthlyAllowance === -1 ? '100%' : `${usagePercent}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {userTier === 'STUDIO' || user?.plan === 'studio' || user?.monthlyAllowance === -1
                ? `Unlimited monthly checks active \u2022 Quota resets ${user?.resetDate ? new Date(user.resetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'every 30 days'}.`
                : `${Math.max(0, (user?.monthlyAllowance ?? tierConfig.monthlyFileLimit) - (user?.filesChecked ?? usage?.filesChecked ?? 0))} checks remaining \u2022 Quota resets ${user?.resetDate ? new Date(user.resetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'every 30 days'}.`
              }
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
                <span className="text-sm font-semibold text-slate-400">€{tierConfig.priceEur}/mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Batch size: up to {tierConfig.maxBatchSize} files &bull; {userTier === 'FREE' ? 'Single-file QC' : 'Full Matrix & Evidence'}
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
              <div className="flex items-center justify-between text-[11px]">
                {user?.status === 'cancelled' ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Auto-Renewal Cancelled</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Subscription Active</span>
                  </span>
                )}
                <Link
                  href="/pricing"
                  className="text-slate-400 hover:text-cyan-400 text-xs transition-colors"
                >
                  Manage Plan
                </Link>
              </div>
            )}
          </div>

          {/* QC Inspection Summary */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Inspection History</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono">
                {history.length} <span className="text-sm font-normal text-slate-400">batches</span>
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

        {/* Section 1: Local Projects & Version Organization (Phase 5) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Client Projects &amp; Versions</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                if (userTier === 'FREE') {
                  triggerGate('Projects & Organization', 'Project organization and track revision tracking are available on Pro and Studio plans.', 'PRO');
                  return;
                }
                setShowNewProjectModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {userTier === 'FREE' ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{userTier === 'FREE' ? 'New Project (Pro)' : 'New Project'}</span>
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/30 text-xs text-slate-400">
              No client projects created yet. Organize your files and version progressions locally.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map(proj => (
                <div key={proj.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        Client: {proj.client}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{proj.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {proj.files.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic">No tracks linked yet.</div>
                    ) : (
                      proj.files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              f.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {f.status}
                            </span>
                            <span className="font-medium text-white truncate">{f.filename}</span>
                            {f.version_tag && (
                              <span className="text-[10px] font-mono text-cyan-400">({f.version_tag})</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">{f.profile_name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Custom QC Profiles (Phase 6) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Custom Delivery Profiles</h2>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                (Stored locally in your browser cache — export presets before clearing browser data or changing devices)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (userTier === 'FREE') {
                  triggerGate('Custom Delivery Profiles', 'Create, version, import, and export custom delivery profiles on Pro and Studio plans.', 'PRO');
                  return;
                }
                setShowCustomProfileModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {userTier === 'FREE' ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-purple-400" />}
              <span>{userTier === 'FREE' ? 'Create Custom Profile (Pro)' : 'Create Custom Profile'}</span>
            </button>
          </div>

          {customProfiles.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-slate-800 bg-slate-900/30 text-xs text-slate-400">
              No custom QC profiles created. Create custom profiles to enforce specific client or label loudness and peak specifications.
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {customProfiles.map(p => (
                <div key={p.profile_id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">{p.platform} &bull; v{p.version}</span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteCustomProfile(p.profile_id);
                          setCustomProfiles(loadCustomProfiles());
                        }}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-bold text-white text-sm mt-1">{p.name}</div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-cyan-300 font-bold">
                    {p.rules.min_lufs !== undefined ? `${p.rules.min_lufs} to ${p.rules.max_lufs} LUFS` : 'Universal'} &bull; ≤ {p.rules.max_true_peak_dbtp ?? -1.0} dBTP
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: History / Recent QC Batches Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span>Recent QC Inspections</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                (Stored locally on your device/browser cache — private and never uploaded to cloud audio storage)
              </p>
            </div>
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
                          if (!tierConfig.pdfCertificate) {
                            triggerGate('PDF QC Certificate', 'Export cryptographic PDF inspection certificates with SHA-256 signatures for your clients.', 'PRO');
                            return;
                          }
                          downloadPdfCertificate(batch);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                        <span>PDF Certificate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!tierConfig.csvExport) {
                            triggerGate('CSV Matrix Export', 'Download structured CSV inspection reports and multi-track metadata spreadsheets.', 'PRO');
                            return;
                          }
                          downloadCsvLocally(batch);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>CSV Matrix</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!tierConfig.jsonExport) {
                            triggerGate('Machine-Readable JSON Export', 'Download structured JSON metrics for automated studio pipelines on the Studio plan.', 'STUDIO');
                            return;
                          }
                          exportQcResultAsJson(batch);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                        title="Export JSON (Studio)"
                      >
                        <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="text-base font-bold text-white">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Summer EP 2026"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Client / Label</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Atlantic Records / Private"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Profile Modal */}
        <CustomProfileModal
          isOpen={showCustomProfileModal}
          onClose={() => setShowCustomProfileModal(false)}
          onProfileCreated={() => setCustomProfiles(loadCustomProfiles())}
        />

        {/* Upgrade Prompt Modal */}
        <UpgradePromptModal
          prompt={upgradePrompt}
          onClose={() => setUpgradePrompt(null)}
        />
      </div>
    </div>
  );
}
