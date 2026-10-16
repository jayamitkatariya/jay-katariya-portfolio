// One-shot signal for "the loading screen is gone and the page is visible", so
// entrance animations on a directly-loaded route don't play underneath it.

let ready = false;
const listeners = new Set<() => void>();

export function markAppReady() {
  if (ready) return;
  ready = true;
  listeners.forEach(fn => fn());
  listeners.clear();
}

export function onAppReady(fn: () => void): () => void {
  if (ready) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}
