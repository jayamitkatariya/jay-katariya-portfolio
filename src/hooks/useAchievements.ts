import { useState, useCallback, useEffect, createContext, useContext } from 'react';

export type AchievementId = 'explorer' | 'curious_mind' | 'photographer' | 'navigator' | 'night_owl' | 'early_bird';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'explorer', name: 'explorer', description: 'visited all 3 pages', icon: '🧭' },
  { id: 'curious_mind', name: 'curious mind', description: 'chatted with the ai', icon: '💭' },
  { id: 'photographer', name: 'photographer', description: 'opened the lightbox', icon: '📷' },
  { id: 'navigator', name: 'navigator', description: 'used a keyboard shortcut', icon: '⌨️' },
  { id: 'night_owl', name: 'night owl', description: 'visited after midnight', icon: '🌙' },
  { id: 'early_bird', name: 'early bird', description: 'visited before 7am', icon: '🌅' },
];

const STORAGE_KEY = 'jay-achievements';

function loadUnlocked(): Set<AchievementId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as AchievementId[]);
  } catch {}
  return new Set();
}

function saveUnlocked(set: Set<AchievementId>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export interface AchievementState {
  unlocked: Set<AchievementId>;
  unlock: (id: AchievementId) => void;
  total: number;
  earned: number;
  latestUnlock: Achievement | null;
  dismissToast: () => void;
}

export function useAchievements(): AchievementState {
  const [unlocked, setUnlocked] = useState<Set<AchievementId>>(loadUnlocked);
  const [latestUnlock, setLatestUnlock] = useState<Achievement | null>(null);

  const unlock = useCallback((id: AchievementId) => {
    setUnlocked(prev => {
      if (prev.has(id)) return prev;
      const next = new Set<AchievementId>(prev);
      next.add(id);
      saveUnlocked(next);
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) setLatestUnlock(achievement);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => setLatestUnlock(null), []);

  // Check time-based achievements on mount
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) unlock('night_owl');
    if (hour >= 5 && hour < 7) unlock('early_bird');
  }, [unlock]);

  return {
    unlocked,
    unlock,
    total: ACHIEVEMENTS.length,
    earned: unlocked.size,
    latestUnlock,
    dismissToast,
  };
}

export const AchievementContext = createContext<AchievementState | null>(null);

export function useAchievementContext(): AchievementState {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievementContext must be used within AchievementContext.Provider');
  return ctx;
}
