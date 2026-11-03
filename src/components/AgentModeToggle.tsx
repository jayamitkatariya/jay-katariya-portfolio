interface AgentModeToggleProps {
  isAgent: boolean;
  onToggle: () => void;
  className?: string;
}

export default function AgentModeToggle({ isAgent, onToggle, className = '' }: AgentModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isAgent}
      title="a plain, machine-readable version of this site for ai agents"
      className={`font-mono text-[9px] sm:text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] tracking-widest transition-colors pointer-coarse:py-3 pointer-coarse:-my-3 ${className}`}
    >
      [ agent mode: {isAgent ? 'on' : 'off'} ]
    </button>
  );
}
