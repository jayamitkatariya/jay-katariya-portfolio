import { useEffect } from 'react';

// Overflow-hidden alone doesn't stop iOS from scrolling the page behind an
// overlay, so pin the body in place and restore the position on release.
// Counted, so two overlays open at once don't unlock each other.
// (html reserves a stable scrollbar gutter in index.css, so classic scrollbars
// disappearing here doesn't shift the page sideways.)
let locks = 0;
let savedY = 0;

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (locks++ === 0) {
      savedY = window.scrollY;
      const s = document.body.style;
      s.position = 'fixed';
      s.top = `-${savedY}px`;
      s.left = '0';
      s.right = '0';
      s.overflow = 'hidden';
    }
    return () => {
      if (--locks > 0) return;
      const s = document.body.style;
      s.position = '';
      s.top = '';
      s.left = '';
      s.right = '';
      s.overflow = '';
      // instant: html has smooth scrolling, which would visibly scroll back from the top
      window.scrollTo({ top: savedY, behavior: 'instant' });
    };
  }, [active]);
}
