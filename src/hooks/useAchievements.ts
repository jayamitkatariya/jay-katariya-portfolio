import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { onAppReady } from '../lib/appReady';

export type AchievementId =
  | 'explorer' | 'photographer' | 'navigator' | 'night_owl' | 'early_bird'
  | 'indecisive' | 'regular' | 'robot';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  // vague nudge shown in the panel while locked
  hint: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'explorer', name: 'explorer', description: 'visited 3 different pages', icon: '🧭', hint: 'wander around a little' },
  { id: 'photographer', name: 'photographer', description: 'opened the lightbox', icon: '📷', hint: 'some memories deserve a closer look' },
  { id: 'navigator', name: 'navigator', description: 'used a keyboard shortcut', icon: '⌨️', hint: 'who needs a mouse?' },
  { id: 'night_owl', name: 'night owl', description: 'visited after midnight', icon: '🌙', hint: 'come back when everyone is asleep' },
  { id: 'early_bird', name: 'early bird', description: 'visited before 7am', icon: '🌅', hint: 'the early bird gets…' },
  { id: 'indecisive', name: 'indecisive', description: 'flipped the lights 10 times', icon: '🪩', hint: 'light or dark? make up your mind' },
  { id: 'regular', name: 'regular', description: 'came back another day', icon: '🔁', hint: 'see you tomorrow?' },
  { id: 'robot', name: 'beep boop', description: 'read the site the way an agent does', icon: '🤖', hint: 'not everyone reading this is human' },
];

const STORAGE_KEY = 'jay-achievements';

function loadUnlocked(): Set<AchievementId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // drop ids from retired achievements so earned never exceeds total
      const valid = new Set<string>(ACHIEVEMENTS.map(a => a.id));
      return new Set((JSON.parse(raw) as AchievementId[]).filter(id => valid.has(id)));
    }
  } catch {}
  return new Set();
}

function saveUnlocked(set: Set<AchievementId>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
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
  // queue, so two unlocks in the same tick each get their own toast
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  const unlock = useCallback((id: AchievementId) => {
    setUnlocked(prev => {
      if (prev.has(id)) return prev;
      const next = new Set<AchievementId>(prev);
      next.add(id);
      saveUnlocked(next);
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) setToastQueue(q => (q.some(a => a.id === id) ? q : [...q, achievement]));
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => setToastQueue(q => q.slice(1)), []);

  // Time-based achievements, once the loading screen is gone so the toast is actually seen
  useEffect(() => onAppReady(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) unlock('night_owl');
    if (hour >= 5 && hour < 7) unlock('early_bird');
  }), [unlock]);

  return {
    unlocked,
    unlock,
    total: ACHIEVEMENTS.length,
    earned: unlocked.size,
    latestUnlock: toastQueue[0] ?? null,
    dismissToast,
  };
}

export const AchievementContext = createContext<AchievementState | null>(null);

export function useAchievementContext(): AchievementState {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievementContext must be used within AchievementContext.Provider');
  return ctx;
}
