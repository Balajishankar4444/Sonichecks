import { BatchQCResult } from '@/types/qc';

const HISTORY_KEY = 'sonichecks_history_v1';
const USAGE_KEY = 'sonichecks_usage_v1';

export interface UsageState {
  month: string;
  filesChecked: number;
  maxMonthlyLimit: number;
  plan: 'free' | 'pro' | 'studio';
}

export function getSavedHistory(): BatchQCResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveBatchToHistory(batch: BatchQCResult): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedHistory();
    // Keep last 30 runs
    const updated = [batch, ...current.filter(b => b.batch_id !== batch.batch_id)].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    // Update usage
    incrementUsage(batch.summary.total_files);
  } catch (e) {
    console.error('Failed to save to history:', e);
  }
}

export function getUsageState(): UsageState {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-09"
  if (typeof window === 'undefined') {
    return { month: currentMonth, filesChecked: 0, maxMonthlyLimit: 5, plan: 'free' };
  }
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) {
      const state: UsageState = JSON.parse(raw);
      if (state.month === currentMonth) {
        return state;
      }
    }
  } catch (e) {}

  const initial: UsageState = {
    month: currentMonth,
    filesChecked: 0,
    maxMonthlyLimit: 5,
    plan: 'free'
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(USAGE_KEY, JSON.stringify(initial));
  }
  return initial;
}

export function incrementUsage(count: number): void {
  const state = getUsageState();
  state.filesChecked += count;
  if (typeof window !== 'undefined') {
    localStorage.setItem(USAGE_KEY, JSON.stringify(state));
  }
}
