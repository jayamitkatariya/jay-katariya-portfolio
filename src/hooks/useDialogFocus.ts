import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Moves focus into a dialog when it opens, keeps Tab cycling inside it (aria-modal
// promises that), and hands focus back to whatever had it (the button that opened it)
// when it closes, so keyboard users don't get lost behind the backdrop.
export function useDialogFocus<T extends HTMLElement>(isOpen: boolean) {
  const initialFocusRef = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    // after the dialog's first paint, so the element exists and is focusable
    const id = requestAnimationFrame(() => initialFocusRef.current?.focus({ preventScroll: true }));

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = initialFocusRef.current?.closest<HTMLElement>('[role="dialog"]');
      if (!dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = dialog.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trap);

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', trap);
      previous?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  return initialFocusRef;
}
