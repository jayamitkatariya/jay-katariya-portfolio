interface AchievementCounterProps {
  earned: number;
  total: number;
}

export default function AchievementCounter({ earned, total }: AchievementCounterProps) {
  if (earned === 0) return null;

  return (
    <p className="font-mono text-[9px] sm:text-[10px] text-[var(--text-muted)] tracking-widest">
      {earned}/{total} achievements unlocked
    </p>
  );
}
