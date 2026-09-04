import { BatchQCResult } from '@/types/qc';

export interface UsageState {
  month: string;
  filesChecked: number;
  maxMonthlyLimit: number;
  plan: 'free' | 'pro' | 'studio';
  email?: string;
}

function getUsageKey(email?: string): string {
  if (!email || email === 'guest') return 'sonichecks_usage_guest';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `sonichecks_usage_${sanitized}`;
}

function getHistoryKey(email?: string): string {
  if (!email || email === 'guest') return 'sonichecks_history_guest';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `sonichecks_history_${sanitized}`;
}

export function getSavedHistory(email?: string): BatchQCResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getHistoryKey(email);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return [];
  } catch (e) {
    return [];
  }
}

export function saveBatchToHistory(batch: BatchQCResult, email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getHistoryKey(email);
    const current = getSavedHistory(email);
    const maxLocalLimit = 50;
    const updated = [batch, ...current.filter(b => b.batch_id !== batch.batch_id)].slice(0, maxLocalLimit);
    localStorage.setItem(key, JSON.stringify(updated));

    // Update usage state strictly for this specific account
    incrementUsage(batch.summary?.total_files || batch.files?.length || 1, email);
  } catch (e) {
    console.error('Failed to save to history:', e);
  }
}

export function getUsageState(email?: string): UsageState {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-09"
  if (typeof window === 'undefined') {
    return { month: currentMonth, filesChecked: 0, maxMonthlyLimit: 5, plan: 'free', email };
  }
  
  const key = getUsageKey(email);
  let plan: 'free' | 'pro' | 'studio' = 'free';
  let maxMonthlyLimit = 5;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const state: UsageState = JSON.parse(raw);
      if (state.plan) {
        plan = state.plan;
        maxMonthlyLimit = plan === 'studio' ? Infinity : plan === 'pro' ? 100 : 5;
      }
    }
  } catch (e) {}

  // Compute accurate files checked from user's isolated history in the current month
  const history = getSavedHistory(email);
  const actualFilesChecked = history
    .filter(b => b.created_at && b.created_at.startsWith(currentMonth))
    .reduce((acc, b) => acc + (b.summary?.total_files || b.files?.length || 1), 0);

  const usage: UsageState = {
    month: currentMonth,
    filesChecked: actualFilesChecked,
    maxMonthlyLimit,
    plan,
    email
  };

  // Persist synced state
  try {
    localStorage.setItem(key, JSON.stringify(usage));
  } catch (e) {}

  return usage;
}

export function updatePlan(plan: 'free' | 'pro' | 'studio', email?: string): UsageState {
  const state = getUsageState(email);
  state.plan = plan;
  state.maxMonthlyLimit = plan === 'studio' ? Infinity : plan === 'pro' ? 100 : 5;
  if (typeof window !== 'undefined') {
    localStorage.setItem(getUsageKey(email), JSON.stringify(state));
    window.dispatchEvent(new Event('sonichecks_plan_updated'));
  }
  return state;
}

export function incrementUsage(count: number, email?: string): void {
  const state = getUsageState(email);
  state.filesChecked += count;
  if (typeof window !== 'undefined') {
    localStorage.setItem(getUsageKey(email), JSON.stringify(state));
    window.dispatchEvent(new Event('sonichecks_plan_updated'));
  }
}

export function resetGuestSession(): void {
  if (typeof window === 'undefined') return;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const cleanGuest: UsageState = {
    month: currentMonth,
    filesChecked: 0,
    maxMonthlyLimit: 5,
    plan: 'free'
  };
  localStorage.setItem('sonichecks_usage_guest', JSON.stringify(cleanGuest));
  localStorage.removeItem('sonichecks_history_guest');
  window.dispatchEvent(new Event('sonichecks_plan_updated'));
}

export function clearUserHistoryAndUsage(email?: string): void {
  if (typeof window === 'undefined') return;
  if (email) {
    localStorage.removeItem(getHistoryKey(email));
    localStorage.removeItem(getUsageKey(email));
  }
  resetGuestSession();
  window.dispatchEvent(new Event('sonichecks_plan_updated'));
}
