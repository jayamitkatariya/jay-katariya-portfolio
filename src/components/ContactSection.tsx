import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import PixelSprite from './PixelSprite';
import { waver } from './sprites';

const EMAIL = 'hi@jaykatariya.com';

export default function ContactSection({ onSaveContact }: { onSaveContact: () => void }) {
  const [copied, setCopied] = useState(false);
  // the clipboard refused: show the address selected so ⌘C / long-press still works
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      ok = true;
    } catch {
      const area = document.createElement('textarea');
      area.value = EMAIL;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        // execCommand reports failure by returning false, not by throwing
        ok = document.execCommand('copy');
      } catch {}
      area.remove();
    }
    if (timer.current) window.clearTimeout(timer.current);
    setCopied(ok);
    setFailed(!ok);
    timer.current = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, ok ? 1600 : 4000);
  };

  return (
    <section
      id="contact"
      className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 text-center sm:px-6 sm:pb-28 sm:pt-14 md:px-8"
    >
      <h2 className="flex items-baseline justify-center font-mono text-[10px] font-normal tracking-[0.22em] text-[var(--text-tertiary)]">
        03 / say hi
      </h2>

      <p className="mt-6 text-lg font-light text-[var(--text-secondary)] sm:mt-8 sm:text-xl">
        email is best.
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mt-4">
        <a
          href={`mailto:${EMAIL}`}
          className="tap-target font-display text-[clamp(1.5rem,5.2vw,3rem)] leading-none tracking-normal text-[var(--text-primary)] underline decoration-[var(--border-primary)] decoration-1 underline-offset-[5px] transition-colors duration-300 hover:decoration-[var(--accent)] sm:underline-offset-[7px]"
        >
          {EMAIL}
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'email copied' : 'copy email address'}
          data-cursor-label={copied ? 'copied' : 'copy'}
          // the shutter plays once the clipboard actually took it (SoundEffects watches data-copied)
          data-sound="none"
          data-copied={copied}
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-primary)] text-[var(--text-tertiary)] transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.96] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] pointer-coarse:h-11 pointer-coarse:w-11"
        >
          {copied ? <Check size={13} strokeWidth={1.8} /> : <Copy size={12} strokeWidth={1.5} />}
        </button>
      </div>

      <p
        aria-live="polite"
        className={`mt-2 h-4 font-mono text-[8.5px] tracking-[0.2em] transition-opacity duration-200 ${
          copied ? 'text-[var(--accent)] opacity-100' : failed ? 'text-[var(--text-secondary)] opacity-100' : 'opacity-0'
        }`}
      >
        {/* the text has to change for a live region to announce it; a hidden constant won't */}
        {copied ? 'copied to clipboard' : failed ? 'couldn’t copy — select the address above' : ''}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 font-mono text-[9px] tracking-[0.16em] text-[var(--text-tertiary)] sm:mt-8 sm:text-[10px]">
        <a
          href="https://linkedin.com/in/jkatariya"
          target="_blank"
          rel="noreferrer"
          className="tap-target footer-link pointer-coarse:py-3"
        >
          linkedin
        </a>
        <a
          href="https://github.com/jayamitkatariya"
          target="_blank"
          rel="noreferrer"
          className="tap-target footer-link pointer-coarse:py-3"
        >
          github
        </a>
        <a href="/jay-katariya-resume.pdf" target="_blank" rel="noreferrer" className="tap-target footer-link pointer-coarse:py-3">
          resume.pdf
        </a>
        <button
          type="button"
          onClick={onSaveContact}
          className="tap-target footer-link pointer-coarse:py-3"
        >
          save contact
        </button>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-16 hidden w-16 text-[var(--text-tertiary)] lg:block xl:right-10 xl:w-20"
      >
        <PixelSprite frames={waver} fps={3} accent="var(--accent)" />
      </div>
    </section>
  );
}
