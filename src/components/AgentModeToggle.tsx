import { useEffect, useRef, useState } from 'react';
import TextScramble from './TextScramble';
import { prefersReducedMotion } from '../lib/dither';

interface AgentModeToggleProps {
  isAgent: boolean;
  onToggle: () => void;
  className?: string;
}

const SCRAMBLE_MS = 450;

// The label decodes to its new state first, then the site swaps
export default function AgentModeToggle({ isAgent, onToggle, className = '' }: AgentModeToggleProps) {
  const [pending, setPending] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const shown = pending ? !isAgent : isAgent;

  const handleClick = () => {
    if (pending) return;
    if (prefersReducedMotion()) {
      onToggle();
      return;
    }
    setPending(true);
    timer.current = window.setTimeout(() => {
      setPending(false);
      onToggle();
    }, SCRAMBLE_MS + 150);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isAgent}
      title="a plain, machine-readable version of this site for ai agents"
      className={`font-mono text-[9px] sm:text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] tracking-widest transition-colors pointer-coarse:py-3 pointer-coarse:-my-3 ${className}`}
    >
      <TextScramble text={`[ agent mode: ${shown ? 'on' : 'off'} ]`} trigger="mount" duration={SCRAMBLE_MS} />
    </button>
  );
}
