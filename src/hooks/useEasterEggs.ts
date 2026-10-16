import { useEffect, useRef, useState } from 'react';

// Swaps the tab title while the page is in the background.
export function useAwayTitle(awayTitle: string) {
  useEffect(() => {
    let original = document.title;
    const handler = () => {
      if (document.hidden) {
        original = document.title;
        document.title = awayTitle;
      } else {
        document.title = original;
      }
    };
    document.addEventListener('visibilitychange', handler);
    if (document.hidden) handler(); // opened in a background tab
    return () => {
      document.removeEventListener('visibilitychange', handler);
      if (document.title === awayTitle) document.title = original;
    };
  }, [awayTitle]);
}

const VISITS_KEY = 'jay-visits';

function localDay(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Counts distinct days the visitor has been here. Idempotent within a day,
// so StrictMode double-invocation and reloads don't inflate it.
export function useVisitCount(): number {
  const [count] = useState(() => {
    try {
      const raw = localStorage.getItem(VISITS_KEY);
      const prev = raw ? (JSON.parse(raw) as { count: number; last: string }) : null;
      const today = localDay();
      if (prev && prev.last === today) return prev.count;
      const next = { count: (prev?.count ?? 0) + 1, last: today };
      localStorage.setItem(VISITS_KEY, JSON.stringify(next));
      return next.count;
    } catch {
      return 1;
    }
  });
  return count;
}

// Returns a recorder that reports true when called `times` times within `windowMs`.
export function useRapidRepeat(times: number, windowMs: number) {
  const stamps = useRef<number[]>([]);
  return () => {
    const now = performance.now();
    stamps.current = [...stamps.current.filter(t => now - t < windowMs), now];
    if (stamps.current.length >= times) {
      stamps.current = [];
      return true;
    }
    return false;
  };
}
