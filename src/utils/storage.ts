/**
 * Privacy-focused local storage manager for AI EyeCare
 * Never persists camera images or raw biometric coordinates
 */

import { UserSettings, DailyStats } from '../types';

const SETTINGS_KEY = 'ai_eyecare_settings_v1';
const STATS_KEY = 'ai_eyecare_stats_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  breakIntervalMin: 20,
  breakDurationSec: 20,
  lowBlinkRateThreshold: 12,
  blinkSensitivity: 'medium',
  soundEnabled: true,
  volume: 0.6,
  showMeshOverlay: true,
  autoPauseOnAbsence: true,
  absenceThresholdSec: 30,
  notificationsEnabled: true,
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Failed to parse settings, using defaults', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadDailyStats(): Record<string, DailyStats> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return getInitialStatsMap();
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load stats', e);
    return getInitialStatsMap();
  }
}

export function saveDailyStats(stats: Record<string, DailyStats>): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function recordSessionStats(
  activeMinutes: number,
  blinks: number,
  breaksCompleted: number,
  breaksSnoozed: number,
  lowBlinkWarnings: number
): void {
  const today = getTodayKey();
  const allStats = loadDailyStats();
  const existing = allStats[today] || {
    date: today,
    totalActiveMinutes: 0,
    totalBlinks: 0,
    averageBpm: 0,
    breaksCompleted: 0,
    breaksSnoozed: 0,
    lowBlinkWarnings: 0,
  };

  const updatedMinutes = existing.totalActiveMinutes + activeMinutes;
  const updatedBlinks = existing.totalBlinks + blinks;
  const avgBpm = updatedMinutes > 0 ? Math.round(updatedBlinks / updatedMinutes) : 15;

  allStats[today] = {
    date: today,
    totalActiveMinutes: Math.round(updatedMinutes * 10) / 10,
    totalBlinks: updatedBlinks,
    averageBpm: avgBpm,
    breaksCompleted: existing.breaksCompleted + breaksCompleted,
    breaksSnoozed: existing.breaksSnoozed + breaksSnoozed,
    lowBlinkWarnings: existing.lowBlinkWarnings + lowBlinkWarnings,
  };

  saveDailyStats(allStats);
}

export function clearAllUserData(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(STATS_KEY);
  } catch (e) {
    console.error('Failed to clear data', e);
  }
}

function getInitialStatsMap(): Record<string, DailyStats> {
  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  return {
    [dayBefore]: {
      date: dayBefore,
      totalActiveMinutes: 145,
      totalBlinks: 2240,
      averageBpm: 15,
      breaksCompleted: 6,
      breaksSnoozed: 1,
      lowBlinkWarnings: 2,
    },
    [yesterday]: {
      date: yesterday,
      totalActiveMinutes: 180,
      totalBlinks: 2850,
      averageBpm: 16,
      breaksCompleted: 8,
      breaksSnoozed: 2,
      lowBlinkWarnings: 1,
    },
    [today]: {
      date: today,
      totalActiveMinutes: 35,
      totalBlinks: 560,
      averageBpm: 16,
      breaksCompleted: 1,
      breaksSnoozed: 0,
      lowBlinkWarnings: 0,
    },
  };
}
