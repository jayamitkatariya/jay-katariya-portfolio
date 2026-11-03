import { lazy, type ComponentType } from 'react';

// React.lazy caches a rejected import forever, so one flaky request would leave the
// route on the error panel until a manual reload. Retry once after a short pause;
// if that fails too, reload once (guarded per session) to pick up a fresh build —
// a redeploy is the usual cause, since old chunk hashes stop existing.

const RELOAD_KEY = 'chunk-reload';

function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // no storage means no guard: never reload, or a broken chunk would loop forever
    return false;
  }
  window.location.reload();
  return true;
}

export function lazyWithRetry<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await load();
    } catch (first) {
      await new Promise(r => setTimeout(r, 600));
      try {
        return await load();
      } catch {
        // park the import while the page reloads instead of flashing the error panel
        if (reloadOnce()) return new Promise<never>(() => {});
        throw first;
      }
    }
  });
}
