'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  CreditCard,
  Loader2,
  ShieldCheck,
  ChevronDown,
  Zap,
  Lock,
  FileCheck2,
  Layers3,
  BarChart3,
  Headphones,
  XCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import { updatePlan, getUsageState, UsageState } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { FEATURE_MATRIX_ROWS } from '@/config/tiers';

type Plan = 'pro' | 'studio';

export default function PricingPage() {
  const { user, cancelSubscription } = useAuth();
  const [localUsage, setLocalUsage] = useState<UsageState | null>(null);

  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  React.useEffect(() => {
    setLocalUsage(getUsageState(user?.email || undefined));
    const handleUpdate = () => setLocalUsage(getUsageState(user?.email || undefined));
    window.addEventListener('sonichecks_plan_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sonichecks_plan_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const currentPlan = user?.plan || localUsage?.plan || 'free';
  const isCancelled = user?.status === 'cancelled';

  const handleCheckout = async (plan: Plan) => {
    setLoadingPlan(plan);

    try {
      const res = await fetch('/api/checkout/creem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          customerEmail: user?.email,
        }),
      });

      const data = await res.json();

      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      console.error('Checkout failed:', data);
      setLoadingPlan(null);
    } catch (error) {
      console.error('Checkout error:', error);
      setLoadingPlan(null);
    }
  };

  const [showCancelModal, setShowCancelModal] = useState(false);

  const executeCancellation = async () => {
    setShowCancelModal(false);
    setIsCancelling(true);
    setCancelFeedback(null);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        setCancelFeedback({
          type: 'success',
          message: result.message || 'Subscription auto-renewal cancelled. Your account remains active until your 30-day period ends.'
        });
      } else {
        setCancelFeedback({
          type: 'error',
          message: result.message || 'Failed to cancel subscription. Please try again.'
        });
      }
    } catch (err: any) {
      setCancelFeedback({
        type: 'error',
        message: err.message || 'An error occurred while cancelling.'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const renderFeatureValue = (value: string | boolean) => {
    if (value === true || value === '✅') {
      return (
        <div className="flex justify-center">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </span>
        </div>
      );
    }

    if (value === false || value === '❌') {
      return (
        <div className="flex justify-center">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-600">
            <X className="h-3 w-3" />
          </span>
        </div>
      );
    }

    return (
      <span className="text-xs font-semibold text-slate-300">
        {value}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ========================================================= */}
        {/* HERO                                                      */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Same full-precision QC engine on every plan
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Choose the QC workflow
            <span className="block text-cyan-400">
              that fits your audio.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Start free with professional audio analysis. Upgrade when you need
            batch QC, delivery profiles, evidence, certificates, and higher
            volume.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-cyan-500" />
              Audio stays local
            </span>
            <span>•</span>
            <span>Deterministic DSP</span>
            <span>•</span>
            <span>No installation</span>
          </div>

          {/* Cancellation Feedback Banner */}
          {cancelFeedback && (
            <div className={`mt-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-left ${
              cancelFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                {cancelFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{cancelFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelFeedback(null)}
                className="text-xs opacity-70 hover:opacity-100 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* PRICING CARDS                                             */}
        {/* ========================================================= */}

        <section className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* FREE */}
          <div className="relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white">
                  Free
                </h2>

                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                  {currentPlan === 'free' ? 'CURRENT PLAN' : 'START HERE'}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Try the complete core QC engine.
              </p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-black text-white">
                  €0
                </span>
                <span className="mb-1.5 text-xs text-slate-500">
                  / month
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-slate-200">
                5 files / month
              </p>
            </div>

            <div className="mb-6 space-y-2.5">
              {[
                'Full deterministic audio QC',
                'LUFS & loudness',
                'True Peak & clipping',
                'Sample rate & bit depth',
                'PASS / WARNING / FAIL',
                'Basic delivery profiles',
                'Fix recommendations',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2.5 text-xs text-slate-300"
                >
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-auto">
              {currentPlan === 'free' ? (
                <div className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300">
                  Current Plan
                </div>
              ) : (
                <div className="flex w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 py-2.5 text-xs font-semibold text-slate-500">
                  Included
                </div>
              )}

              <p className="mt-2 text-center text-[10px] text-slate-600">
                {currentPlan === 'free' ? '5 files included monthly' : 'Free tier fallback'}
              </p>
            </div>
          </div>

          {/* PRO */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-cyan-500/60 bg-gradient-to-b from-cyan-950/40 to-slate-900 p-5 shadow-2xl shadow-cyan-950/30">

            {/* Recommended */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg bg-cyan-400 px-4 py-1 text-[9px] font-black uppercase tracking-widest text-slate-950">
              {currentPlan === 'pro' ? 'ACTIVE PLAN' : 'Recommended'}
            </div>

            <div className="mb-5 pt-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-cyan-300">
                  Pro
                </h2>

                <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                  <Zap className="h-3 w-3" />
                  PROFESSIONAL
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Professional delivery QC without the guesswork.
              </p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-black text-white">
                  €4.99
                </span>
                <span className="mb-1.5 text-xs text-slate-500">
                  / month
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-cyan-300">
                100 files / month
              </p>
            </div>

            <div className="mb-6 space-y-2.5">
              {[
                'Everything in Free',
                'Full delivery & platform profiles',
                'Batch QC — up to 50 files',
                'Waveform evidence',
                'Exact finding timestamps',
                'Listen around findings',
                'Detailed Why + How to Fix',
                'Professional PDF QC Certificates',
                'Custom QC profiles (Saved in local browser cache)',
                'CSV export & QC history',
                'SHA-256 file integrity',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2.5 text-xs text-slate-200"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-400/15">
                    <Check className="h-3 w-3 text-cyan-300" />
                  </span>
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-auto">
              {currentPlan === 'pro' ? (
                isCancelled ? (
                  <div className="space-y-2">
                    <div className="w-full text-center py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Auto-Renewal Cancelled</span>
                    </div>
                    <p className="text-center text-[10px] text-slate-400">
                      Active until period ends &bull; Then switches to Free
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-500/60 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-400" />
                          Cancel Subscription
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-slate-500">
                      Current plan &bull; Active until period ends
                    </p>
                  </div>
                )
              ) : currentPlan === 'studio' ? (
                <div className="space-y-2">
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 py-3 text-xs font-bold text-slate-500 cursor-not-allowed select-none">
                    <Lock className="h-3.5 w-3.5 text-slate-600" />
                    <span>Available after current plan ends</span>
                  </div>
                  <p className="text-center text-[10px] text-slate-500">
                    Changeable once your active Studio subscription ends
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => handleCheckout('pro')}
                    disabled={loadingPlan === 'pro'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {loadingPlan === 'pro' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Get Pro — €4.99
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    Cancel anytime
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* STUDIO */}
          <div className="relative flex flex-col rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5 shadow-xl">

            <div className="mb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-purple-300">
                  Studio
                </h2>

                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-300">
                  {currentPlan === 'studio' ? 'ACTIVE PLAN' : 'HIGH VOLUME'}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Built for studios and high-volume delivery.
              </p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-black text-white">
                  €14.99
                </span>
                <span className="mb-1.5 text-xs text-slate-500">
                  / month
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-purple-300">
                Unlimited files / month
              </p>
            </div>

            <div className="mb-6 space-y-2.5">
              {[
                'Everything in Pro',
                'Batch QC — up to 200 files',
                'Unlimited custom profiles (Saved in local browser cache)',
                'Projects & multi-track organization',
                'Advanced QC history',
                'Bulk PDF certificates',
                'Batch summary reports',
                'JSON export',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2.5 text-xs text-slate-300"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-400/10">
                    <Check className="h-3 w-3 text-purple-300" />
                  </span>
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-auto">
              {currentPlan === 'studio' ? (
                isCancelled ? (
                  <div className="space-y-2">
                    <div className="w-full text-center py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Auto-Renewal Cancelled</span>
                    </div>
                    <p className="text-center text-[10px] text-slate-400">
                      Active until period ends &bull; Then switches to Free
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-500/60 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-400" />
                          Cancel Subscription
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-slate-500">
                      Current plan &bull; Active until period ends
                    </p>
                  </div>
                )
              ) : currentPlan === 'pro' ? (
                <div className="space-y-2">
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 py-3 text-xs font-bold text-slate-500 cursor-not-allowed select-none">
                    <Lock className="h-3.5 w-3.5 text-slate-600" />
                    <span>Available after current plan ends</span>
                  </div>
                  <p className="text-center text-[10px] text-slate-500">
                    Changeable once your active Pro subscription ends
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => handleCheckout('studio')}
                    disabled={loadingPlan === 'studio'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 py-3 text-xs font-black text-purple-200 transition hover:border-purple-400/50 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {loadingPlan === 'studio' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Get Studio — €14.99
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[10px] text-slate-600">
                    For high-volume workflows
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* VALUE STRIP                                               */}
        {/* ========================================================= */}

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
            <div className="rounded-lg bg-slate-800 p-2">
              <Headphones className="h-4 w-4 text-slate-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Free
              </p>
              <p className="text-[10px] text-slate-500">
                Measure your audio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-4 py-3">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <FileCheck2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-cyan-300">
                Pro
              </p>
              <p className="text-[10px] text-slate-400">
                Prove it's ready to deliver.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-950/10 px-4 py-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Layers3 className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-300">
                Studio
              </p>
              <p className="text-[10px] text-slate-500">
                Manage high-volume QC.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TRUST / SAME ENGINE                                      */}
        {/* ========================================================= */}

        <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/10 p-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Same full-precision analysis on every plan
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  No reduced precision. No skipped DSP checks. Your audio stays on your device.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500">
              <span>ITU-R BS.1770-4</span>
              <span>•</span>
              <span>4× True Peak</span>
              <span>•</span>
              <span>Local</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FULL COMPARISON                                           */}
        {/* ========================================================= */}

        <section className="mt-6">

          <button
            type="button"
            onClick={() => setShowComparison((value) => !value)}
            className="mx-auto flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <BarChart3 className="h-4 w-4" />

            {showComparison
              ? 'Hide detailed comparison'
              : 'Compare all features'}

            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showComparison ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showComparison && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950">
                      <th className="p-4 text-left font-bold text-slate-300">
                        Feature
                      </th>

                      <th className="w-32 p-4 text-center font-bold text-slate-400">
                        Free
                      </th>

                      <th className="w-32 border-x border-cyan-500/20 bg-cyan-950/20 p-4 text-center font-bold text-cyan-300">
                        Pro
                      </th>

                      <th className="w-32 p-4 text-center font-bold text-purple-300">
                        Studio
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/70">
                    {FEATURE_MATRIX_ROWS.map((row) => (
                      <tr
                        key={row.name}
                        className="transition hover:bg-slate-800/30"
                      >
                        <td className="p-3.5 font-semibold text-slate-300">
                          {row.name}
                        </td>

                        <td className="p-3.5 text-center">
                          {renderFeatureValue(row.free)}
                        </td>

                        <td className="border-x border-cyan-500/10 bg-cyan-950/10 p-3.5 text-center">
                          {renderFeatureValue(row.pro)}
                        </td>

                        <td className="p-3.5 text-center">
                          {renderFeatureValue(row.studio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* FAQ                                                       */}
        {/* ========================================================= */}

        <section className="mx-auto mt-8 max-w-3xl border-t border-slate-900 pt-7">
          <h2 className="text-center text-sm font-black text-white">
            Frequently asked questions
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs font-bold text-white">
                Is the same audio engine used on Free?
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Yes. Free users get the same full-precision deterministic DSP
                analysis. Paid plans unlock higher volume and professional workflow features.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs font-bold text-white">
                Is my audio uploaded?
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Sonichecks is designed around local processing. Supported audio
                analysis runs directly in your browser, so your audio does not need
                to be uploaded for those checks.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs font-bold text-white">
                What makes Pro different?
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Pro adds the professional delivery workflow: batch QC, delivery
                profiles, waveform evidence, finding audition, custom profiles,
                QC certificates, history and exports.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs font-bold text-white">
                Who needs Studio?
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Studio is for users processing large numbers of files or managing
                recurring projects and client deliveries.
              </p>
            </div>

          </div>
        </section>

      </div>

      {/* Cancellation Pop-up Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl sm:p-8 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon Header */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>

            {/* Title & Description */}
            <div className="text-center">
              <h3 className="text-lg font-black text-white sm:text-xl">
                Cancel Auto-Renewal?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
                You will retain full access to all <span className="font-bold text-cyan-300 uppercase">{currentPlan}</span> features, higher file limits, and QC certificates until the end of your current 30-day billing cycle.
              </p>
            </div>

            {/* Benefit retention points */}
            <div className="my-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span>Active <span className="capitalize">{currentPlan}</span> access continues until cycle ends</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span>No further automatic charges or debits</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                  <ShieldCheck className="h-3 w-3" />
                </span>
                <span>Account gracefully switches to Free plan afterwards</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-full rounded-xl bg-cyan-400 hover:bg-cyan-300 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                Keep My Subscription
              </button>
              <button
                type="button"
                onClick={executeCancellation}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-500/50 cursor-pointer"
              >
                <XCircle className="h-4 w-4 text-rose-400" />
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}