import { useSyncExternalStore } from 'react';

// Mute and volume, kept apart so coming back from mute doesn't lose the level.
// localStorage + the `storage` event, so a second tab follows the first.

const MUTED_KEY = 'sound-muted';
const VOLUME_KEY = 'sound-volume';
export const DEFAULT_VOLUME = 0.4;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

const getMuted = () => read(MUTED_KEY) === '1';
const getVolume = () => {
  // Number('') is 0: silence with no way back. Anything outside (0, 1] is the default.
  const v = Number(read(VOLUME_KEY));
  return v > 0 && v <= 1 ? v : DEFAULT_VOLUME;
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === MUTED_KEY || e.key === VOLUME_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export const useSoundMuted = () => useSyncExternalStore(subscribe, getMuted, () => false);
export const useSoundVolume = () => useSyncExternalStore(subscribe, getVolume, () => DEFAULT_VOLUME);

export function setSoundMuted(muted: boolean) {
  write(MUTED_KEY, muted ? '1' : '0');
  emit();
}

export const toggleSoundMuted = () => setSoundMuted(!getMuted());
