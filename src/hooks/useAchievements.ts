import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { onAppReady } from '../lib/appReady';
import type { SpriteName } from '../components/SectionHeading';

export type AchievementId =
  | 'explorer' | 'photographer' | 'navigator' | 'night_owl' | 'early_bird'
  | 'indecisive' | 'regular' | 'robot';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: SpriteName;
  // vague nudge shown in the panel while locked
  hint: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'explorer', name: 'explorer', description: 'visited 3 different pages', icon: 'globe', hint: 'wander around a little' },
  { id: 'photographer', name: 'photographer', description: 'opened the lightbox', icon: 'camera', hint: 'some memories deserve a closer look' },
  { id: 'navigator', name: 'navigator', description: 'used a keyboard shortcut', icon: 'arrow', hint: 'who needs a mouse?' },
  { id: 'night_owl', name: 'night owl', description: 'visited after midnight', icon: 'moon', hint: 'come back when everyone is asleep' },
  { id: 'early_bird', name: 'early bird', description: 'visited before 7am', icon: 'star', hint: 'the early bird gets…' },
  { id: 'indecisive', name: 'indecisive', description: 'flipped the lights 10 times', icon: 'disco', hint: 'light or dark? make up your mind' },
  { id: 'regular', name: 'regular', description: 'came back another day', icon: 'hourglass', hint: 'see you tomorrow?' },
  { id: 'robot', name: 'beep boop', description: 'read the site the way an agent does', icon: 'robot', hint: 'not everyone reading this is human' },
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
  // the source of truth for unlock(): side effects stay out of the state updater, which React may run twice
  const unlockedRef = useRef(unlocked);
  // queue, so two unlocks in the same tick each get their own toast
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  const unlock = useCallback((id: AchievementId) => {
    const prev = unlockedRef.current;
    if (prev.has(id)) return;
    const next = new Set<AchievementId>(prev);
    next.add(id);
    unlockedRef.current = next;
    setUnlocked(next);
    saveUnlocked(next);
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) setToastQueue(q => (q.some(a => a.id === id) ? q : [...q, achievement]));
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
