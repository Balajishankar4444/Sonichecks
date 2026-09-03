import { BatchQCResult } from '@/types/qc';

export interface UsageState {
  month: string;
  filesChecked: number;
  maxMonthlyLimit: number;
  plan: 'free' | 'pro' | 'studio';
  email?: string;
}

function getUsageKey(email?: string): string {
  if (!email) return 'sonichecks_usage_guest';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `sonichecks_usage_${sanitized}`;
}

function getHistoryKey(email?: string): string {
  if (!email) return 'sonichecks_history_guest';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `sonichecks_history_${sanitized}`;
}

export function getSavedHistory(email?: string): BatchQCResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getHistoryKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveBatchToHistory(batch: BatchQCResult, email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedHistory(email);
    // Keep last 50 runs per user
    const updated = [batch, ...current.filter(b => b.batch_id !== batch.batch_id)].slice(0, 50);
    localStorage.setItem(getHistoryKey(email), JSON.stringify(updated));

    // Update usage for this account
    incrementUsage(batch.summary.total_files, email);
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
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const state: UsageState = JSON.parse(raw);
      if (state.month === currentMonth) {
        state.email = email;
        return state;
      }
    }
  } catch (e) {}

  const initial: UsageState = {
    month: currentMonth,
    filesChecked: 0,
    maxMonthlyLimit: 5,
    plan: 'free',
    email
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(initial));
  }
  return initial;
}

export function updatePlan(plan: 'free' | 'pro' | 'studio', email?: string): UsageState {
  const state = getUsageState(email);
  state.plan = plan;
  state.maxMonthlyLimit = plan === 'studio' ? 500 : plan === 'pro' ? 100 : 5;
  if (typeof window !== 'undefined') {
    localStorage.setItem(getUsageKey(email), JSON.stringify(state));
  }
  return state;
}

export function incrementUsage(count: number, email?: string): void {
  const state = getUsageState(email);
  state.filesChecked += count;
  if (typeof window !== 'undefined') {
    localStorage.setItem(getUsageKey(email), JSON.stringify(state));
  }
}
