interface AchievementCounterProps {
  earned: number;
  total: number;
  onClick: () => void;
}

export default function AchievementCounter({ earned, total, onClick }: AchievementCounterProps) {
  return (
    <button
      onClick={onClick}
      className="font-mono text-[9px] sm:text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] tracking-widest transition-colors underline-offset-4 hover:underline pointer-coarse:py-3 pointer-coarse:-my-3"
    >
      {earned}/{total} achievements unlocked
    </button>
  );
}
