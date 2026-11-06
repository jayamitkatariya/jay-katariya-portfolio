import { useEffect, useRef } from 'react';
import { play, setEnabled, setVolume, suspend, unlock, wake, SOUND_EVENT, type PlayOptions } from '../lib/sound/engine';
import { isCue, type Cue } from '../lib/sound/patch';
import { useSoundMuted, useSoundVolume } from '../lib/sound/store';

// One listener for the whole site. Components never call play(): they declare
// what they are through attributes they already carry (aria-pressed,
// aria-expanded, links in a nav), plus `data-sound` for the few whose meaning
// only the call site knows. Hover, scroll, focus and typing never sound.

declare module 'react' {
  interface HTMLAttributes<T> {
    /** a cue name, or 'none' to keep a control silent (its outcome sounds instead) */
    'data-sound'?: Cue | 'none';
    /** sound this subtree on click instead of pointerdown, where a press may turn out to be a drag or swipe */
    'data-sound-on'?: 'click';
  }
}

type Hit = { cue: Cue; opts?: PlayOptions } | null;

const INTERACTIVE = 'button, a[href], [role="button"], [role="tab"], [data-sound], input[type="checkbox"], input[type="radio"]';
const TEXT_FIELD =
  'textarea, select, [contenteditable=""], [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"])';

function classify(target: EventTarget | null): Hit {
  if (!(target instanceof Element)) return null;
  let start: Element = target;
  // a label is part of the control it names
  const label = start.closest('label');
  if (label?.control) start = label.control;
  // a caret landing in a field is not a press; stop before the walk climbs to a row
  if (start.closest(TEXT_FIELD)) return null;

  const el = start.closest(INTERACTIVE);
  if (!el) return null;

  const named = el.getAttribute('data-sound');
  if (named === 'none') return null;
  if (isCue(named)) return { cue: named };

  if (el.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return null;

  // toggles: play the cue for where the state is going
  const pressed = el.getAttribute('aria-pressed');
  if (pressed !== null) return { cue: pressed === 'true' ? 'toggleOff' : 'toggleOn' };
  if (el instanceof HTMLInputElement) return { cue: el.checked && el.type === 'checkbox' ? 'toggleOff' : 'toggleOn' };

  const expanded = el.getAttribute('aria-expanded');
  if (expanded !== null) return { cue: expanded === 'true' ? 'close' : 'open' };

  if (el.getAttribute('role') === 'tab') return { cue: 'pick' };
  // choosing a page from a nav is choosing among siblings
  if (el.tagName === 'A' && el.closest('nav')) return { cue: 'pick' };
  // links are lighter than buttons
  if (el.tagName === 'A') return { cue: 'tap', opts: { velocity: 0.75 } };
  return { cue: 'tap' };
}

const MODIFIERS = new Set(['Shift', 'Meta', 'Control', 'Alt', 'CapsLock']);

const deferred =(target: EventTarget | null) => target instanceof Element && !!target.closest('[data-sound-on="click"]');

export default function SoundEffects() {
  const muted = useSoundMuted();
  const volume = useSoundVolume();

  useEffect(() => setEnabled(!muted), [muted]);
  useEffect(() => setVolume(volume), [volume]);

  // the way back from mute can't sound at the press (the engine was still off),
  // so it plays here; the initial render stays quiet
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!muted) {
      unlock();
      // resume() may still be settling from the same press; give it a frame
      requestAnimationFrame(() => play('toggleOn'));
    }
  }, [muted]);

  useEffect(() => {
    const sound = (hit: Hit) => hit && play(hit.cue, hit.opts);

    const onPointerDown = (e: PointerEvent) => {
      unlock();
      if (e.button !== 0) return;
      if (deferred(e.target)) return;
      sound(classify(e.target));
    };
    const onClick = (e: MouseEvent) => {
      // keyboard-activated clicks (detail 0) were already sounded from keydown
      if (e.detail === 0 || !deferred(e.target)) return;
      sound(classify(e.target));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // Escape and bare modifiers don't count as a user gesture; starting audio on them only warns
      if (!MODIFIERS.has(e.key) && e.key !== 'Escape') unlock();
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof Element && t.closest(TEXT_FIELD)) return;
      const modal = document.querySelector('[aria-modal="true"], #mobile-menu');
      if (e.key === 'Escape') {
        if (modal) play('close');
        return;
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.querySelector('[data-lightbox]')) {
        play('pick');
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      // Space doesn't follow a link
      if (e.key === ' ' && t instanceof Element && t.closest(INTERACTIVE)?.tagName === 'A') return;
      sound(classify(t));
    };

    // Outcomes are renders, not presses: watch for the edge into the state.
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'attributes') {
          const el = r.target as Element;
          const value = el.getAttribute(r.attributeName!);
          if (value === null || value === 'false' || value === r.oldValue) continue;
          if (r.attributeName === 'data-copied') play('copy');
          if (r.attributeName === 'data-success') play('success');
        } else {
          for (const n of r.addedNodes) {
            if (!(n instanceof Element)) continue;
            if (n.matches('[data-success="true"]') || n.querySelector('[data-success="true"]')) play('success');
          }
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['data-copied', 'data-success'],
    });

    const onSoundEvent = (e: Event) => {
      const cue = (e as CustomEvent<string>).detail;
      if (isCue(cue)) play(cue);
    };
    const onVisibility = () => {
      if (document.hidden) suspend();
      else wake();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(SOUND_EVENT, onSoundEvent);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(SOUND_EVENT, onSoundEvent);
      observer.disconnect();
    };
  }, []);

  return null;
}
